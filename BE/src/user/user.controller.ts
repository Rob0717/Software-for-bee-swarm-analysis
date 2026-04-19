import {Body, Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards} from '@nestjs/common';
import {ApiCookieAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags} from '@nestjs/swagger';
import {UserService} from '@app/user/user.service';
import {UserResponseDto} from '@shared/dto/user/user-response.dto';
import {UserMapper} from '@shared/mappers/user.mapper';
import {Roles} from '@shared/decorators/roles.decorator';
import {UserRole} from '@shared/enums/user-role.enum';
import {JwtAuthGuard} from '@shared/guards/jwt-auth.guard';
import {RolesGuard} from '@shared/guards/roles.guard';
import {AuthenticatedUserRequest} from '@shared/interfaces/authenticated-request.interface';
import {ManageUserAccessRequestDto} from '@shared/dto/user/manage-user-access-request.dto';
import {AccessGuard} from '@shared/guards/access.guard';

@ApiTags('users')
@Controller('users')
export class UserController {

  constructor(
    private _userService: UserService,
    private _userMapper: UserMapper
  ) {}

  /**
   * Returns the profile of the currently authenticated user.
   */
  @Get('user')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Get authenticated user profile',
    description: 'Returns the profile data of the currently authenticated user.',
  })
  @ApiOkResponse({type: UserResponseDto, description: 'Authenticated user profile.'})
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }`,
  })
  public async getUser(@Req() request: AuthenticatedUserRequest): Promise<UserResponseDto> {
    const user = await this._userService.findOne(request.user.id);
    return this._userMapper.mapUserEntityToUserResponseDto(user!);
  }

  /**
   * Returns all registered beekeeper accounts.
   * Restricted to admin users only.
   */
  @Get()
  @UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
  @ApiCookieAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all beekeepers (admin only)',
    description: 'Returns a list of all registered beekeeper accounts. Restricted to admin users.',
  })
  @ApiOkResponse({type: UserResponseDto, isArray: true, description: 'List of all beekeeper users.'})
  public async getAllBeekeepers(): Promise<UserResponseDto[]> {
    const users = await this._userService.findAllBeekeepers();
    return this._userMapper.mapUserEntityArrayToUserResponseDtoArray(users);
  }

  /**
   * Updates the access status (ban/unban) of a specific user.
   * Restricted to admin users only. Admins cannot manage other admins or themselves.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
  @ApiCookieAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manage user access (admin only)',
    description: 'Bans or unbans a specific user by ID. Admins cannot ban other admins or themselves.',
  })
  @ApiParam({name: 'id', type: Number, description: 'ID of the user to manage.'})
  @ApiOkResponse({description: 'User access successfully updated.'})
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }`,
  })
  public manageUserAccess(@Req() req: AuthenticatedUserRequest, @Body() dto: ManageUserAccessRequestDto, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this._userService.manageUserAccess(req.user.id, dto, id);
  }
}