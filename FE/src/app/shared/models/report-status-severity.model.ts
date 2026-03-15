import {ReportStatusSeverityEnum} from '@shared/enums/report-status-severity.enum';
import {ReportStatus} from '@shared/enums/report-status.enum';

export const ReportStatusSeverityModel: Record<ReportStatus, ReportStatusSeverityEnum> = {
  new: ReportStatusSeverityEnum.NEW,
  in_progress: ReportStatusSeverityEnum.IN_PROGRESS,
  resolved: ReportStatusSeverityEnum.RESOLVED,
  rejected: ReportStatusSeverityEnum.REJECTED
};
