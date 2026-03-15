import {ReportStatus} from '@shared/enums/report-status.enum';
import {ApiProperty} from '@nestjs/swagger';

export class ReportResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Report ID'
  })
  id: number;

  @ApiProperty({
    example: 'This is the area where bee swarm was found.',
    description: 'Report description'
  })
  description: string;

  @ApiProperty({
    example: 'report1.jpg',
    description: 'Filename of the report photo',
    required: false
  })
  photoUrl?: string;

  @ApiProperty({
    example: 49.7384,
    description: 'Latitude'
  })
  latitude: number;

  @ApiProperty({
    example: 13.3736,
    description: 'Longitude'
  })
  longitude: number;

  @ApiProperty({
    example: ReportStatus.NEW,
    enum: ReportStatus,
    description: 'Status of the report'
  })
  status: ReportStatus;

  @ApiProperty({
    example: '2025-07-30T12:34:56.789Z',
    description: 'Date and time when the report was created',
    type: String,
    format: 'date-time'
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-07-30T14:00:00.000Z',
    description: 'Date and time when the report was last updated',
    type: String,
    format: 'date-time'
  })
  updatedAt: Date;

  @ApiProperty({
    example: 'Karel',
    required: false,
    type: String
  })
  assignedToUserName?: string;

  @ApiProperty({
    example: 'Novák',
    required: false,
    type: String
  })
  assignedToUserSurname?: string
}
