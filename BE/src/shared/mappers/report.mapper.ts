import {Injectable} from '@nestjs/common';
import {ReportEntity} from '@shared/entities/report.entity';
import {ReportResponseDto} from '@shared/dto/report/report-response.dto';

/**
 * Mapper service responsible for converting ReportEntity objects into ReportResponseDto objects.
 */
@Injectable()
export class ReportMapper {

  /**
   * Maps a single ReportEntity to a ReportResponseDto.
   * Includes optional assignedTo username and surname if the report is assigned.
   * @param report - The report entity to map, with assignedTo relation optionally loaded.
   * @returns The mapped report response DTO.
   */
  public mapReportEntityToReportResponseDto(report: ReportEntity): ReportResponseDto {
    return {
      id: report.id,
      description: report.description,
      photoUrl: report.photoUrl ?? '',
      latitude: report.latitude,
      longitude: report.longitude,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      assignedToUserName: report.assignedTo?.name,
      assignedToUserSurname: report.assignedTo?.surname
    };
  }
}