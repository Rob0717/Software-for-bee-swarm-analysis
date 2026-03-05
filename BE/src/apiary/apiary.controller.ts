import {
  ApiBadRequestResponse,
  ApiBody, ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Req, UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from '@shared/guards/jwt-auth.guard';
import {ApiaryCreateRequestDto} from '@app/apiary/dto/apiary-create-request.dto';
import {ApiaryService} from '@app/apiary/apiary.service';
import {ApiaryCreateResponseDto} from '@app/apiary/dto/apiary-create-response.dto';
import {AuthenticatedUserRequest} from '@shared/interfaces/authenticated-request.interface';
import {AccessGuard} from '@shared/guards/access.guard';

@ApiTags('apiaries')
@Controller('apiaries')
export class ApiaryController {

  constructor(
    private _apiaryService: ApiaryService
  ) {}

  /**
   * Creates a new apiary for the authenticated user.
   * Validates name length and radius range before persisting.
   */
  @Post('apiary')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Create a new apiary',
    description: 'Creates a new apiary associated with the authenticated user. Requires a valid JWT in httpOnly cookie.',
  })
  @ApiBody({type: ApiaryCreateRequestDto})
  @ApiOkResponse({
    type: ApiaryCreateResponseDto,
    description: 'Apiary successfully created.',
  })
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }`,
  })
  @ApiBadRequestResponse({
    description: `Messages:
  - { type: 'INVALID_REQUEST', code: 'INVALID_REQUEST' }`,
  })
  public async createApiary(@Req() req: AuthenticatedUserRequest, @Body() dto: ApiaryCreateRequestDto): Promise<ApiaryCreateResponseDto> {
    return await this._apiaryService.createApiary(req.user.id, dto);
  }

  /**
   * Returns all apiaries belonging to the authenticated user, ordered by ID ascending.
   */
  @Get('user')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Get apiaries of authenticated user',
    description: 'Returns all apiaries created by the currently authenticated user.',
  })
  @ApiOkResponse({
    type: [ApiaryCreateResponseDto],
    description: 'List of apiaries belonging to the authenticated user.',
  })
  public async getApiariesByUser(@Req() req: AuthenticatedUserRequest): Promise<ApiaryCreateResponseDto[]> {
    return await this._apiaryService.getApiariesByUser(req.user.id);
  }

  /**
   * Deletes an apiary by ID.
   * Only the owner of the apiary is allowed to delete it.
   */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, AccessGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Delete an apiary by ID',
    description: 'Deletes the specified apiary. Only the owner of the apiary can perform this action.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the apiary to delete.',
  })
  @ApiNoContentResponse({
    description: 'Apiary successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'APIARY_NOT_FOUND', code: 'APIARY_NOT_FOUND' }`,
  })
  public async removeApiaryFromUserById(@Req() req: AuthenticatedUserRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this._apiaryService.removeApiaryFromUserById(req.user.id, id);
  }
}