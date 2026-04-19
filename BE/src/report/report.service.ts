import {BadRequestException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {ReportEntity} from '@shared/entities/report.entity';
import {ReportResponseDto} from '@shared/dto/report/report-response.dto';
import {MailService} from '@shared/services/mail.service';
import {LocationService} from '@app/location/location.service';
import {ApiaryService} from '@app/apiary/apiary.service';
import {ApiaryEntity} from '@shared/entities/apiary.entity';
import {UserService} from '@app/user/user.service';
import {ChangeReportStatusRequestDto} from '@shared/dto/report/change-report-status-request.dto';
import {ChangeReportStatusResponseDto} from '@shared/dto/report/change-report-status-response.dto';
import {ReportMapper} from '@shared/mappers/report.mapper';
import {promises as fs} from 'fs';
import * as path from 'path';
import {ReportStatus} from '@shared/enums/report-status.enum';
import {CreateReportInterface} from '@shared/interfaces/create-report.interface';
import {sanitizeString} from '@shared/sanitizers/sanitize-string';

@Injectable()
export class ReportService {

  constructor(
    @InjectRepository(ReportEntity)
    private _reportRepository: Repository<ReportEntity>,
    private _mailService: MailService,
    private _locationService: LocationService,
    private _apiaryService: ApiaryService,
    private _userService: UserService,
    private _reportMapper: ReportMapper
  ) {}

  /**
   * Creates a new swarm report, saves it to the database, and attempts to notify
   * the nearest beekeeper within their apiary radius with email.
   * The description is sanitized using Unicode normalization before saving.
   * @param createReportRequestBody - The report payload including description, coordinates, and optional photo URL.
   * @throws BadRequestException if the description length is outside the allowed range (10–200 characters).
   * @throws InternalServerErrorException if the notification email fails to send.
   */
  async createReport(createReportRequestBody: CreateReportInterface): Promise<void> {
    if (createReportRequestBody.description.length < 10 || createReportRequestBody.description.length > 200) {
      throw new BadRequestException({type: 'INVALID_REQUEST', code: 'INVALID_REQUEST'});
    }

    const report = this._reportRepository.create({
      // Normalize and strip combining diacritical marks to sanitize user input
      description: sanitizeString(createReportRequestBody.description),
      latitude: Number(Number(createReportRequestBody.latitude).toFixed(14)),
      longitude: Number(Number(createReportRequestBody.longitude).toFixed(14)),
      photoUrl: createReportRequestBody.photoUrl,
    });

    await this._reportRepository.save(report);

    const swarm: ReportResponseDto = {
      id: report.id,
      description: report.description,
      photoUrl: report.photoUrl ?? '',
      latitude: report.latitude,
      longitude: report.longitude,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };

    const apiaries = await this._apiaryService.getAllApiaries();
    const closestApiary = this._findClosestApiary(apiaries, swarm);

    if (closestApiary) {
      try {
        await this._reportRepository.update(swarm.id, {assignedTo: closestApiary.createdBy});
        await this._mailService.sendSwarmHandling(closestApiary.createdBy.email, closestApiary.createdBy.language, closestApiary.createdBy.name, swarm);
      } catch {
        throw new InternalServerErrorException({type: 'EMAIL_SEND_ERROR', code: 'EMAIL_SEND_ERROR'});
      }
    }
  }

  /**
   * Finds the closest apiary to the swarm location that is within the apiary's configured radius.
   * Uses air distance for comparison.
   * @param apiaries - The list of all active apiaries to search through.
   * @param swarm - The swarm report containing the location to match against.
   * @returns The closest matching apiary, or null if none are within range.
   */
  private _findClosestApiary(apiaries: ApiaryEntity[], swarm: ReportResponseDto): ApiaryEntity | null {
    let smallestDistance = Number.POSITIVE_INFINITY;
    let closestApiary: ApiaryEntity | null = null;

    for (const apiary of apiaries) {
      const distance = this._locationService.getAirDistanceInKm(swarm.latitude, swarm.longitude, apiary.latitude, apiary.longitude);
      if (distance < smallestDistance && distance <= apiary.apiaryRadius) {
        smallestDistance = distance;
        closestApiary = apiary;
      }
    }

    return closestApiary;
  }

  /**
   * Updates the status of a swarm report.
   * Only the beekeeper currently assigned to the report can change its status.
   * @param userId - ID of the authenticated user requesting the status change.
   * @param reportId - ID of the report to update.
   * @param dto - The request payload containing the new status.
   * @returns A promise resolving to the updated status.
   * @throws NotFoundException if the user or report does not exist.
   */
  public async changeReportStatusById(userId: number, reportId: number, dto: ChangeReportStatusRequestDto): Promise<ChangeReportStatusResponseDto> {
    const user = await this._userService.findOne(userId);

    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    const report = await this._reportRepository.findOne({where: {id: reportId, assignedTo: {id: userId}}});

    if (!report) {
      throw new NotFoundException({type: 'REPORT_NOT_FOUND', code: 'REPORT_NOT_FOUND'});
    }

    await this._reportRepository.update(reportId, {status: dto.status});
    return {status: dto.status};
  }

  /**
   * Returns all swarm reports ordered by creation date descending.
   * Loads the assignedTo relation for each report.
   * @returns A promise resolving to a list of all report response DTOs.
   */
  public async getAllReports(): Promise<ReportResponseDto[]> {
    const reports = await this._reportRepository.find({
      order: {createdAt: 'DESC'},
      relations: {assignedTo: true},
    });

    return reports.map(report => this._reportMapper.mapReportEntityToReportResponseDto(report));
  }

  /**
   * Returns all swarm reports assigned to a specific user, ordered by creation date descending.
   * @param userId - ID of the authenticated user.
   * @returns A promise resolving to a list of report response DTOs assigned to the user.
   * @throws NotFoundException if the user does not exist.
   */
  public async getReportsByUser(userId: number): Promise<ReportResponseDto[]> {
    const user = await this._userService.findOne(userId);

    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    const reports = await this._reportRepository.find({
      where: {assignedTo: {id: userId}},
      relations: {assignedTo: true},
      order: {createdAt: 'DESC'},
    });

    return reports.map(report => this._reportMapper.mapReportEntityToReportResponseDto(report));
  }

  /**
   * Permanently deletes a swarm report and its associated photo file from disk.
   * If the photo file does not exist, deletion proceeds silently.
   * Restricted to admin users only (enforced with RolesGuard in the controller).
   * @param userId - ID of the authenticated admin user.
   * @param reportId - ID of the report to delete.
   * @throws NotFoundException if the user or report does not exist.
   */
  public async deleteReport(userId: number, reportId: number): Promise<void> {
    const user = await this._userService.findOne(userId);
    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    const report = await this._reportRepository.findOne({where: {id: reportId}});
    if (!report) {
      throw new NotFoundException({type: 'REPORT_NOT_FOUND', code: 'REPORT_NOT_FOUND'});
    }

    await this._reportRepository.delete(report.id);

    const filename = report.photoUrl ?? null;
    if (filename) {
      const filePath = path.resolve(process.cwd(), 'uploads', 'reports', filename);
      try {
        await fs.unlink(filePath);
      } catch {
        // Photo file not found on disk — proceed silently
      }
    }
  }

  /**
   * Assigns the authenticated beekeeper to an unassigned swarm report.
   * Sets the report status to IN_PROGRESS.
   * @param userId - ID of the authenticated beekeeper.
   * @param reportId - ID of the report to take over.
   * @throws NotFoundException if the user or report does not exist.
   * @throws BadRequestException if the report is already assigned to another beekeeper or to this beekeeper.
   */
  public async takeOverReport(userId: number, reportId: number): Promise<void> {
    const user = await this._userService.findOne(userId);
    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    const report = await this._reportRepository.findOne({
      where: {id: reportId},
      relations: {assignedTo: true},
    });

    if (!report) {
      throw new NotFoundException({type: 'REPORT_NOT_FOUND', code: 'REPORT_NOT_FOUND'});
    }

    // Check if already assigned to anyone before checking specific user
    if (report.assignedTo) {
      if (report.assignedTo.id === user.id) {
        throw new BadRequestException({type: 'INVALID_REQUEST', code: 'INVALID_REQUEST'});
      }
      throw new BadRequestException({type: 'ALREADY_ASSIGNED', code: 'ALREADY_ASSIGNED'});
    }

    await this._reportRepository.update(reportId, {assignedTo: {id: userId}, status: ReportStatus.IN_PROGRESS});
  }

  /**
   * Removes the authenticated beekeeper's assignment from a swarm report.
   * Resets the report status back to NEW.
   * @param userId - ID of the authenticated beekeeper.
   * @param reportId - ID of the report to unassign from.
   * @throws NotFoundException if the user or report does not exist.
   * @throws BadRequestException if the report is not currently assigned to this beekeeper.
   */
  public async removeReportFromUser(userId: number, reportId: number): Promise<void> {
    const user = await this._userService.findOne(userId);
    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    const report = await this._reportRepository.findOne({
      where: {id: reportId},
      relations: {assignedTo: true},
    });

    if (!report) {
      throw new NotFoundException({type: 'REPORT_NOT_FOUND', code: 'REPORT_NOT_FOUND'});
    }

    if (report.assignedTo?.id !== user.id) {
      throw new BadRequestException({type: 'INVALID_REQUEST', code: 'INVALID_REQUEST'});
    }

    await this._reportRepository.update(reportId, {assignedTo: null, status: ReportStatus.NEW});
  }
}