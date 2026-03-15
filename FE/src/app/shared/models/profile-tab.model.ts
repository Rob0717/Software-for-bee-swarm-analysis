import {ApiaryCreateResponseDto} from '@shared/models/generated-dtos/apiary-create-response-dto';
import {ReportResponseDto} from '@shared/models/generated-dtos/report-response-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';

export type ProfileTabModel = {
  title: string;
  value: string;
  icon: string;
  contentTitle: string;
  contentDescription: string;
  placeholder: string;
  userData?: UserResponseDto | null;
  apiariesData?: ApiaryCreateResponseDto[] | null;
  mySwarmsData? : ReportResponseDto[] | null;
};
