import {ApiProperty} from '@nestjs/swagger';
import {IsString} from 'class-validator';

export class ValidateSetNewPasswordRequestDto {
  @ApiProperty({
    example: 'aabb1234'
  })
  @IsString()
  token: string;
}