import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserEntity} from '@shared/entities/user.entity';
import {UserService} from '@app/user/user.service';
import {UserController} from '@app/user/user.controller';
import {UserMapper} from '@shared/mappers/user.mapper';
import {ReportMapper} from '@shared/mappers/report.mapper';
import {SharedModule} from '@shared/shared.module';

@Module({
  controllers: [UserController],
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    SharedModule
  ],
  providers: [UserService, UserMapper, ReportMapper],
  exports: [UserService]
})
export class UserModule {}
