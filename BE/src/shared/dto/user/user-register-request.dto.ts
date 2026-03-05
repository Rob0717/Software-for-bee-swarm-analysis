import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsNumber, IsOptional, IsString, IsStrongPassword} from 'class-validator';
import {Transform} from 'class-transformer';

export class UserRegisterRequestDto {
  @ApiProperty({
    example: 'Albert',
    description: 'User name'
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Einstein',
    description: 'User surname'
  })
  @IsString()
  surname: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email'
  })
  @IsEmail({}, {message: 'INVALID_EMAIL'})
  @Transform(({value}): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : String(value)
  )
  email: string;

  @ApiProperty({
    example: 'cs'
  })
  @IsString()
  language: string;

  @ApiProperty({
    example: 'User1234_',
    description: 'User password'
  })
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    example: '+420123456789',
    description: 'User phone number',
    required: false
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 'Technicka 8, Plzen',
    description: 'User address',
    required: false
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 45.12345,
    description: 'User latitude'
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    example: 23.12345,
    description: 'User longitude'
  })
  @IsNumber()
  longitude: number;
}
