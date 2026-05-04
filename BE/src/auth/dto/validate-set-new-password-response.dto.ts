import {ApiProperty} from '@nestjs/swagger';

export class ValidateSetNewPasswordResponseDto {
  @ApiProperty({
    example: true
  })
  valid: boolean
}