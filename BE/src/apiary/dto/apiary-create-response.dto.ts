import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsNumber, IsOptional, IsString} from 'class-validator';
import {Type} from 'class-transformer';

export class ApiaryCreateResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Apiary ID'
  })
  id: number;

  @ApiProperty({
    example: 'My apiary',
    description: 'Name of the apiary.'
  })
  @IsNotEmpty()
  @IsString()
  apiaryName: string;

  @ApiProperty({
    example: 30,
    description: 'Radius from apiary in km'
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  apiaryRadius: number;

  @ApiProperty({
    example: 12.12345,
    description: 'Latitude'
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({
    example: 10.12345,
    description: 'Longitude'
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @ApiProperty({
    example: 'Klatovska 17, Pilsen',
    description: 'Address of the apiary',
    required: false,
    nullable: true,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  address: string | null;
}