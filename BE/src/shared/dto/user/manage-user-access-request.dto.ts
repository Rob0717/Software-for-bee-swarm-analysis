import {ApiProperty} from '@nestjs/swagger';
import {IsBoolean} from 'class-validator';

export class ManageUserAccessRequestDto {
  @ApiProperty({
    example: true
  })
  @IsBoolean()
  banUser: boolean;
}