import {Body, Controller, Get, Patch, Post, Query, Req, Res, UseGuards} from '@nestjs/common';
import {Response} from 'express';
import {AuthService} from '@app/auth/auth.service';
import {UserLoginRequestDto} from '@app/auth/dto/user-login-request.dto';
import {UserRegisterRequestDto} from '@shared/dto/user/user-register-request.dto';
import {JwtAuthGuard} from '@shared/guards/jwt-auth.guard';
import {AuthenticatedUserRequest} from '@shared/interfaces/authenticated-request.interface';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse, ApiCookieAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {UserResponseDto} from '@shared/dto/user/user-response.dto';
import {SetNewPasswordRequestDto} from '@app/auth/dto/set-new-password-request.dto';
import {UserVerifyAccountResponseDto} from '@app/auth/dto/user-verify-account-response.dto';
import {UserLoggedInResponseDto} from '@app/auth/dto/user-logged-in-response.dto';
import {ValidateSetNewPasswordRequestDto} from '@app/auth/dto/validate-set-new-password-request.dto';
import {ValidateSetNewPasswordResponseDto} from '@app/auth/dto/validate-set-new-password-response.dto';
import {ChangeUserLanguageRequestDto} from '@app/auth/dto/change-user-language-request.dto';
import {OptionalJwtAuthGuard} from '@shared/guards/optional-jwt-auth.guard';
import {PossiblyAuthenticatedRequestInterface} from '@shared/interfaces/possibly-authenticated-request.interface';
import {TypeCodeResponseDto} from '@app/auth/dto/type-code-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {

  constructor(
    private _authService: AuthService,
  ) {}

  /**
   * Returns the current authentication status of the user based on the JWT in httpOnly cookie.
   * If the user is banned, the cookie is cleared and isLoggedIn is returned as false.
   */
  @Get('logged-in-status')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Check if user is logged in',
    description: 'Verifies if the user has a valid access token in httpOnly cookie and returns their current authentication status.',
  })
  @ApiOkResponse({
    type: UserLoggedInResponseDto,
    description: 'Returns user login status.',
  })
  public isUserLoggedIn(@Req() request: PossiblyAuthenticatedRequestInterface, @Res({passthrough: true}) res: Response): Promise<UserLoggedInResponseDto> {
    return this._authService.isUserLoggedInFromRequest(request, res);
  }

  /**
   * Authenticates the user and sets a JWT access token as a httpOnly cookie.
   * Also updates the user's preferred language on successful login.
   */
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates the user and sets a JWT access token as httpOnly cookie. Also updates the user\'s preferred language.',
  })
  @ApiBody({type: UserLoginRequestDto})
  @ApiOkResponse({
    description: 'Successful login — JWT access token set as httpOnly cookie.',
  })
  @ApiUnauthorizedResponse({
    description: `Messages:
  - { type: 'UNAUTHORIZED', code: 'INVALID_CREDENTIALS' }
  - { type: 'UNAUTHORIZED', code: 'ACCOUNT_NOT_VERIFIED' }`,
  })
  @ApiForbiddenResponse({
    description: `Messages:
  - { type: 'FORBIDDEN_BANNED_ACCESS', code: 'FORBIDDEN_BANNED_ACCESS' }`,
  })
  public login(@Body() dto: UserLoginRequestDto, @Res({passthrough: true}) res: Response): Promise<void> {
    return this._authService.login(res, dto);
  }

  /**
   * Clears the httpOnly cookie containing the JWT access token, effectively logging the user out.
   */
  @Post('logout')
  @ApiOperation({
    summary: 'User logout',
    description: 'Clears the httpOnly cookie containing the JWT access token.',
  })
  @ApiOkResponse({
    description: 'Successfully logged out.',
  })
  public logout(@Res({passthrough: true}) res: Response): void {
    this._authService.clearAuthCookie(res);
  }

  /**
   * Registers a new user account and sends an email verification link.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Registers a new user and sends a verification email containing an activation token.',
  })
  @ApiBody({type: UserRegisterRequestDto})
  @ApiOkResponse({
    description: 'User successfully registered.',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: `Messages:
  - { type: 'EMAIL_ALREADY_EXISTS', code: 'EMAIL_ALREADY_EXISTS' }`,
  })
  @ApiInternalServerErrorResponse({
    description: `Messages:
  - { type: 'REGISTRATION_FAILED', code: 'REGISTRATION_FAILED' }`,
  })
  public register(@Body() dto: UserRegisterRequestDto): Promise<UserResponseDto> {
    return this._authService.register(dto);
  }

  /**
   * Confirms a user account using the token received with email.
   */
  @Get('confirm-account')
  @ApiOperation({
    summary: 'Confirm user account',
    description: 'Validates the confirmation token sent with email and activates the user account.',
  })
  @ApiQuery({name: 'token', type: String, description: 'Account confirmation token received with email.'})
  @ApiOkResponse({
    type: UserVerifyAccountResponseDto,
    description: 'Account successfully verified.',
  })
  @ApiBadRequestResponse({
    description: `Messages:
  - { type: 'INVALID_OR_EXPIRED_TOKEN', code: 'INVALID_OR_EXPIRED_TOKEN' }
  - { type: 'ACCOUNT_ALREADY_VERIFIED', code: 'ACCOUNT_ALREADY_VERIFIED' }`,
  })
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }`,
  })
  public confirm(@Query('token') token: string): Promise<UserVerifyAccountResponseDto> {
    return this._authService.validateConfirmationToken(token);
  }

  /**
   * Initiates the forgotten password flow by sending a password reset email.
   */
  @Get('forgotten-password')
  @ApiOperation({
    summary: 'Forgotten password',
    description: 'Sends a password reset email to the provided email address.',
  })
  @ApiQuery({name: 'email', type: String, description: 'Email address of the account to reset.'})
  @ApiQuery({name: 'lang', type: String, description: 'Preferred language for the reset email.'})
  @ApiOkResponse({
    description: 'Password reset email sent successfully.',
    type: TypeCodeResponseDto,
  })
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }`,
  })
  @ApiInternalServerErrorResponse({
    description: `Messages:
  - { type: 'EMAIL_SEND_ERROR', code: 'EMAIL_SEND_ERROR' }`,
  })
  public handleForgottenPassword(@Query('email') email: string, @Query('lang') language: string): Promise<TypeCodeResponseDto> {
    return this._authService.handleForgottenPassword(email, language);
  }

  /**
   * Sets a new password for the user using a valid password reset token.
   */
  @Post('set-new-password')
  @ApiOperation({
    summary: 'Set new password',
    description: 'Allows the user to set a new password using the reset token received with email.',
  })
  @ApiBody({type: SetNewPasswordRequestDto})
  @ApiOkResponse({
    type: TypeCodeResponseDto,
    description: 'Password successfully changed.',
  })
  @ApiBadRequestResponse({
    description: `Messages:
  - { type: 'INVALID_REQUEST', code: 'INVALID_REQUEST' } — password too short or too long
  - { type: 'INVALID_OR_EXPIRED_TOKEN', code: 'INVALID_OR_EXPIRED_TOKEN' }
  - { type: 'PASSWORD_ALREADY_CHANGED', code: 'PASSWORD_ALREADY_CHANGED' }`,
  })
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }`,
  })
  public setNewPassword(@Body() dto: SetNewPasswordRequestDto): Promise<TypeCodeResponseDto> {
    return this._authService.setNewPassword(dto);
  }

  /**
   * Validates whether a password reset token is still valid before allowing the user to proceed.
   */
  @Post('validate-set-password-token')
  @ApiOperation({
    summary: 'Validate password reset token',
    description: 'Checks whether the password reset token is still valid and the password change has not been completed yet.',
  })
  @ApiBody({type: ValidateSetNewPasswordRequestDto})
  @ApiOkResponse({
    type: ValidateSetNewPasswordResponseDto,
    description: 'Returns whether the token is valid.',
  })
  public validateSetPasswordToken(@Body() dto: ValidateSetNewPasswordRequestDto): Promise<ValidateSetNewPasswordResponseDto> {
    return this._authService.validateSetPasswordToken(dto);
  }

  /**
   * Updates the preferred language of the authenticated user.
   */
  @Patch('change-user-language')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Change user language',
    description: 'Updates the authenticated user\'s preferred language. Requires JWT in httpOnly cookie.',
  })
  @ApiBody({type: ChangeUserLanguageRequestDto})
  @ApiNoContentResponse({
    description: 'Language successfully changed.',
  })
  @ApiNotFoundResponse({
    description: `Messages:
  - { type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' }`,
  })
  public async changeUserLanguage(@Req() request: AuthenticatedUserRequest, @Body() dto: ChangeUserLanguageRequestDto): Promise<void> {
    await this._authService.changeUserLanguage(request.user.id, dto.language);
  }
}