import {Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {ReportRepository} from '@app/pages/reports/persistent/repositories/report.repository';
import {ChangeReportStatusRequestDto} from '@shared/models/generated-dtos/change-report-status-request-dto';
import {ChangeReportStatusResponseDto} from '@shared/models/generated-dtos/change-report-status-response-dto';
import {ReportResponseDto} from '@shared/models/generated-dtos/report-response-dto';

/**
 * Facade for swarm report-related operations.
 * Acts as an abstraction layer between report UI components and the repository.
 */
@Injectable({providedIn: 'root'})
export class ReportFacade {

  constructor(
    private _reportRepository: ReportRepository
  ) {}

  /**
   * Retrieves all swarm reports.
   * @returns A promise resolving to an array of all report response objects.
   */
  public async getAllReports(): Promise<ReportResponseDto[]> {
    return await firstValueFrom(this._reportRepository.getAllReports$());
  }

  /**
   * Creates a new swarm report with an optional photo attachment.
   * Assembles the request as a multipart FormData payload.
   * @param description - A description of the swarm.
   * @param latitude - The latitude coordinate of the location.
   * @param longitude - The longitude coordinate of the location.
   * @param photo - An optional photo file of the swarm.
   * @returns A promise resolving to the created report response.
   */
  public async createReport(description: string, latitude: number, longitude: number, photo?: File): Promise<ReportResponseDto> {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());

    if (photo) {
      formData.append('photo', photo);
    }

    return await firstValueFrom(this._reportRepository.createReport$(formData));
  }

  /**
   * Retrieves all swarm reports belonging to the currently authenticated user.
   * @returns A promise resolving to an array of the user's report response objects.
   */
  public async getReportsByUser(): Promise<ReportResponseDto[] | null> {
    return await firstValueFrom(this._reportRepository.getReportsByUser$());
  }

  /**
   * Updates the status of a specific swarm report.
   * @param id - The ID of the report to update.
   * @param status - The request payload containing the new status.
   * @returns A promise resolving to the updated report response.
   */
  public async changeReportStatusById(id: number, status: ChangeReportStatusRequestDto): Promise<ChangeReportStatusResponseDto> {
    return await firstValueFrom(this._reportRepository.changeReportStatusById$(id, status));
  }

  /**
   * Deletes a swarm report by its ID.
   * @param id - The ID of the report to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  public async deleteReport(id: number): Promise<void> {
    return await firstValueFrom(this._reportRepository.deleteReport$(id));
  }

  /**
   * Assigns the currently authenticated beekeeper as the handler of a swarm report.
   * @param id - The ID of the report to take over.
   * @returns A promise that resolves when the take-over is complete.
   */
  public async takeOverReport(id: number): Promise<void> {
    return await firstValueFrom(this._reportRepository.takeOverReport$(id));
  }

  /**
   * Removes the association between a swarm report and the currently authenticated beekeeper.
   * @param id - The ID of the report to disassociate from the beekeeper.
   * @returns A promise that resolves when the removal is complete.
   */
  public async removeSwarmFromBeekeeperById(id: number): Promise<void> {
    return await firstValueFrom(this._reportRepository.removeSwarmFromBeekeeperById$(id));
  }
}
