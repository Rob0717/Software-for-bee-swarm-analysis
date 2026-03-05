import {IsString} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {Transform} from 'class-transformer';

export class UserLoginRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email'
  })
  @IsString()
  @Transform(({value}): string => typeof value === 'string' ? value.trim().toLowerCase() : String(value))
  email: string;

  @ApiProperty({
    example: 'User1234_',
    description: 'User password'
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'cs'
  })
  @IsString()
  language: string;
}
