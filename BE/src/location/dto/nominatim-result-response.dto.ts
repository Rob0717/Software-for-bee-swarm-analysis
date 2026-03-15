import {ApiProperty} from '@nestjs/swagger';

export class NominatimResultResponseDto {
  @ApiProperty({
    example: 1,
  })
  place_id: number;

  @ApiProperty({
    example: 'Plzen'
  })
  display_name: string;

  @ApiProperty({
    example: '12.345'
  })
  lat: string;

  @ApiProperty({
    example: '21.345'
  })
  lon: string;
}