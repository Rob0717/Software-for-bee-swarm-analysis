import {ApiProperty} from '@nestjs/swagger';

export class TypeCodeResponseDto {
  @ApiProperty({
    example: 'ABCD'
  })
  type: string;

  @ApiProperty({
    example: 'EFGH'
  })
  code: string;
}