import {ReportResponseDto} from '@shared/models/generated-dtos/report-response-dto';

export type ReportsTableRowModel = ReportResponseDto & {
  createdAtDate: Date;
  updatedAtDate: Date;
  assignedKey: string | null;
};
