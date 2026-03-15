import {ApiProperty} from '@nestjs/swagger';
import {IsString} from 'class-validator';

export class ChangeUserLanguageRequestDto {
  @ApiProperty({
    example: 'en'
  })
  @IsString()
  language: string;
}