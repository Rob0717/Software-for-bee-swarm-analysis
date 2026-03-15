import {ApiProperty} from '@nestjs/swagger';
import {ReportStatus} from '@shared/enums/report-status.enum';
import {IsEnum} from 'class-validator';

export class ChangeReportStatusResponseDto {
  @ApiProperty({
    examples: [
      ReportStatus.NEW,
      ReportStatus.IN_PROGRESS,
      ReportStatus.RESOLVED,
      ReportStatus.REJECTED
    ],
    enum: ReportStatus,
    description: 'Status of the report'
  })
  @IsEnum(ReportStatus)
  status: ReportStatus;
}