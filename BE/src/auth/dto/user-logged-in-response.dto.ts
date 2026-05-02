import {ApiProperty} from '@nestjs/swagger';

export class UserLoggedInResponseDto {
  @ApiProperty({
    example: true
  })
  isLoggedIn: boolean;
}