import {UserRole} from '@shared/enums/user-role.enum';
import {ApiProperty} from '@nestjs/swagger';
import {IsOptional} from 'class-validator';

export class UserResponseDto {
  @ApiProperty({
    example: 1,
    description: 'User ID'
  })
  id: number;

  @ApiProperty({
    example: 'Albert',
    description: 'User name'
  })
  name: string;

  @ApiProperty({
    example: 'Einstein',
    description: 'User surname'
  })
  surname: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email'
  })
  email: string;

  @ApiProperty({
    example: '+420123456789',
    description: 'User phone number',
    required: false,
    nullable: true,
    type: 'string'
  })
  @IsOptional()
  phoneNumber: string | null;

  @ApiProperty({
    example: UserRole.BEEKEEPER,
    description: 'User role',
    enum: UserRole
  })
  role: UserRole;

  @ApiProperty({
    example: false,
    description: 'User banned status'
  })
  banned: boolean;

  @ApiProperty({
    example: false,
    description: 'User verified status'
  })
  verified: boolean;

  @ApiProperty({
    example: 'Technicka 8, Plzen',
    description: 'User address',
    required: false,
    nullable: true,
    type: 'string'
  })
  @IsOptional()
  address: string | null;

  @ApiProperty({
    example: 45.12345,
    description: 'User latitude'
  })
  latitude: number;

  @ApiProperty({
    example: 23.12345,
    description: 'User longitude'
  })
  longitude: number;
}
