import {Module} from '@nestjs/common';
import {ApiaryController} from '@app/apiary/apiary.controller';
import {ApiaryService} from '@app/apiary/apiary.service';
import {ApiaryEntity} from '@shared/entities/apiary.entity';
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserModule} from '@app/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiaryEntity]),
    UserModule
  ],
  controllers: [ApiaryController],
  providers: [ApiaryService],
  exports: [ApiaryService]
})
export class ApiaryModule {}
