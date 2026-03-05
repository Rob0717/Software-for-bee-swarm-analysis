import {ReportStatus} from '@shared/enums/report-status.enum';
import {ApiProperty} from '@nestjs/swagger';
import {IsEnum} from 'class-validator';

export class ChangeReportStatusRequestDto {
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