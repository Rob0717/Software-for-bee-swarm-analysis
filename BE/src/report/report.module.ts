import {Module} from '@nestjs/common';
import {ReportMapper} from '@shared/mappers/report.mapper';
import {ReportService} from '@app/report/report.service';
import {ReportController} from '@app/report/report.controller';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ReportEntity} from '@shared/entities/report.entity';
import {MailService} from '@shared/services/mail.service';
import {LocationService} from '@app/location/location.service';
import {UserModule} from '@app/user/user.module';
import {ApiaryModule} from '@app/apiary/apiary.module';
import {MailTemplateService} from '@shared/services/mail-template.service';

@Module({
  controllers: [ReportController],
  imports: [TypeOrmModule.forFeature([ReportEntity]), UserModule, ApiaryModule],
  providers: [ReportService, ReportMapper, MailService, LocationService, MailTemplateService],
  exports: [ReportService, ReportMapper]
})
export class ReportModule {}
