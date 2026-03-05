import {ApiProperty} from '@nestjs/swagger';
import {IsJWT, IsStrongPassword} from 'class-validator';

export class SetNewPasswordRequestDto {
  @ApiProperty({
    example: 'abcdef123456'
  })
  @IsJWT({message: 'INVALID_OR_EXPIRED_TOKEN'})
  token: string;

  @ApiProperty({
    example: 'Test12345_'
  })
  @IsStrongPassword()
  newPassword: string;
}