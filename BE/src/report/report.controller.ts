import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {ReportService} from '@app/report/report.service';
import {FileInterceptor} from '@nestjs/platform-express';
import {multerConfig} from '@shared/config/multer.config';
import {AuthenticatedUserRequest} from '@shared/interfaces/authenticated-request.interface';
import {JwtAuthGuard} from '@shared/guards/jwt-auth.guard';
import {ChangeReportStatusRequestDto} from '@shared/dto/report/change-report-status-request.dto';
import {ChangeReportStatusResponseDto} from '@shared/dto/report/change-report-status-response.dto';
import {ReportResponseDto} from '@shared/dto/report/report-response.dto';
import {Roles} from '@shared/decorators/roles.decorator';
import {UserRole} from '@shared/enums/user-role.enum';
import {RolesGuard} from '@shared/guards/roles.guard';
import {AccessGuard} from '@shared/guards/access.guard';
import {CreateReportInterface} from '@shared/interfaces/create-report.interface';

@ApiTags('reports')
@Controller('reports')
export class ReportController {

  constructor(
    private _reportService: ReportService
  ) {}

  /**
   * Creates a new swarm report. Photo upload is optional.
   * Automatically assigns the report to the nearest beekeeper within range and sends a notification email.
   */
  @Post()
  @UseInterceptors(FileInterceptor('photo', multerConfig))
  @ApiOperation({
    summary: 'Create a new swarm report',
    description: 'Submits a new bee swarm report with an optional photo. The report is automatically assigned to the nearest beekeeper within their apiary radius.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: {type: 'string', example: 'Bee swarm on the tree in front of the house'},
        latitude: {type: 'number', example: 49.7384},
        longitude: {type: 'number', example: 13.3736},
        photo: {type: 'string', format: 'binary'},
      },
      required: ['description', 'latitude', 'longitude'],
    },
  })
  @ApiCreatedResponse({description: 'Report successfully created.'})
  @ApiBadRequestResponse({
    description: `Messages:
  - { type: 'INVALID_REQUEST', code: 'INVALID_REQUEST' } — description out of allowed length range`,
  })
  public createReport(@Body() createReportRequestBody: CreateReportInterface, @UploadedFile() file: Express.Multer.File): Promise<void> {
    const photoUrl = file?.filename;
    return this._reportService.createReport({...createReportRequestBody, photoUrl});
  }

  /**
   * Returns all swarm reports ordered by creation date descending.
   * Requires authentication. Intended for the reports map view.
   */
  @Get()
  @UseGuards(JwtAuthGuard, AccessGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Get all swarm reports',
    description: 'Returns all swarm reports ordered by creation date descending. Includes assignedTo relation.',
  })
  @ApiOkResponse({
    type: [ReportResponseDto],
    description: 'List of all swarm reports.',
  })
  public getAllReports(): Promise<ReportResponseDto[]> {
    return this._reportService.getAllReports();
  }

  /**
   * Updates the status of a specific report.
   * Only the beekeeper assigned to the report can change its status.
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Change report status',
    description: 'Updates the status of a swarm report. Only the beekeeper currently assigned to the report can perform this action.',
  })
  @ApiParam({name: 'id', type: Number, description: 'ID of the report to update.'})
  @ApiOkResponse({
    description: 'Report status successfully updated.',
    type: ChangeReportStatusResponseDto,
  })
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }
  - { type: 'REPORT_NOT_FOUND', code: 'REPORT_NOT_FOUND' }`,
  })
  public changeReportStatusById(@Req() req: AuthenticatedUserRequest, @Param('id', ParseIntPipe) id: number, @Body() dto: ChangeReportStatusRequestDto): Promise<ChangeReportStatusResponseDto> {
    return this._reportService.changeReportStatusById(req.user.id, id, dto);
  }

  /**
   * Returns all swarm reports assigned to the authenticated beekeeper.
   */
  @Get('user')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Get reports assigned to authenticated user',
    description: 'Returns all swarm reports currently assigned to the authenticated beekeeper, ordered by creation date descending.',
  })
  @ApiOkResponse({
    type: [ReportResponseDto],
    description: 'List of reports assigned to the authenticated user.',
  })
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }`,
  })
  public getReportsByUser(@Req() req: AuthenticatedUserRequest): Promise<ReportResponseDto[]> {
    return this._reportService.getReportsByUser(req.user.id);
  }

  /**
   * Permanently deletes a report by ID, including its associated photo file.
   * Restricted to admin users only.
   */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Delete a report (admin only)',
    description: 'Permanently deletes a swarm report and its associated photo file. Restricted to admin users.',
  })
  @ApiParam({name: 'id', type: Number, description: 'ID of the report to delete.'})
  @ApiNoContentResponse({description: 'Report successfully deleted.'})
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }
  - { type: 'REPORT_NOT_FOUND', code: 'REPORT_NOT_FOUND' }`,
  })
  public async deleteReport(@Req() req: AuthenticatedUserRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
    await this._reportService.deleteReport(req.user.id, id);
  }

  /**
   * Assigns the authenticated beekeeper to an unassigned swarm report.
   * Sets the report status to IN_PROGRESS.
   */
  @Patch(':id/takeover')
  @UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
  @Roles(UserRole.BEEKEEPER)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Take over a swarm report (beekeeper only)',
    description: 'Assigns the authenticated beekeeper to an unassigned swarm report and sets its status to IN_PROGRESS.',
  })
  @ApiParam({name: 'id', type: Number, description: 'ID of the report to take over.'})
  @ApiOkResponse({description: 'Report successfully taken over.'})
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }
  - { type: 'REPORT_NOT_FOUND', code: 'REPORT_NOT_FOUND' }`,
  })
  @ApiBadRequestResponse({
    description: `Messages:
  - { type: 'ALREADY_ASSIGNED', code: 'ALREADY_ASSIGNED' } — report is already assigned to another beekeeper
  - { type: 'INVALID_REQUEST', code: 'INVALID_REQUEST' } — report is already assigned to this beekeeper`,
  })
  public takeOverReport(@Req() req: AuthenticatedUserRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this._reportService.takeOverReport(req.user.id, id);
  }

  /**
   * Removes the authenticated beekeeper's assignment from a swarm report.
   * Resets the report status back to NEW.
   */
  @Patch(':id/remove')
  @UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
  @Roles(UserRole.BEEKEEPER)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Remove assignment from a report (beekeeper only)',
    description: 'Removes the authenticated beekeeper from a swarm report and resets its status back to NEW.',
  })
  @ApiParam({name: 'id', type: Number, description: 'ID of the report to unassign from.'})
  @ApiOkResponse({description: 'Assignment successfully removed.'})
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }
  - { type: 'REPORT_NOT_FOUND', code: 'REPORT_NOT_FOUND' }`,
  })
  @ApiBadRequestResponse({
    description: `Messages:
  - { type: 'INVALID_REQUEST', code: 'INVALID_REQUEST' } — report is not assigned to this beekeeper`,
  })
  public removeReportFromUser(@Req() req: AuthenticatedUserRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this._reportService.removeReportFromUser(req.user.id, id);
  }
}