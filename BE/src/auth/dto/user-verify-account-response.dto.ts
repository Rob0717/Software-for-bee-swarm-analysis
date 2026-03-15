import {ApiProperty} from '@nestjs/swagger';

export class UserVerifyAccountResponseDto {
  @ApiProperty({
    example: 'VERIFICATION_SUCCESS'
  })
  type: string;

  @ApiProperty({
    example: 'VERIFICATION_SUCCESS'
  })
  code: string;
}