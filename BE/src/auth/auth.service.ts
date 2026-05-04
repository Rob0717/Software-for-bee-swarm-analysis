import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {UserService} from '@app/user/user.service';
import {JwtService} from '@nestjs/jwt';
import {UserEntity} from '@shared/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import {JwtPayload} from '@shared/interfaces/jwt-payload.interface';
import {UserRegisterRequestDto} from '@shared/dto/user/user-register-request.dto';
import {UserResponseDto} from '@shared/dto/user/user-response.dto';
import {MailService} from '@shared/services/mail.service';
import {AccountConfirmationInterface} from '@shared/interfaces/account-confirmation.interface';
import {SetNewPasswordRequestDto} from '@app/auth/dto/set-new-password-request.dto';
import {AccountForgottenPasswordInterface} from '@shared/interfaces/account-forgotten-password.interface';
import {ConfigService} from '@nestjs/config';
import {UserLoginRequestDto} from '@app/auth/dto/user-login-request.dto';
import {UserVerifyAccountResponseDto} from '@app/auth/dto/user-verify-account-response.dto';
import {isEmail} from 'class-validator';
import {UserLoggedInResponseDto} from '@app/auth/dto/user-logged-in-response.dto';
import {ValidateSetNewPasswordRequestDto} from '@app/auth/dto/validate-set-new-password-request.dto';
import {ValidateSetNewPasswordResponseDto} from '@app/auth/dto/validate-set-new-password-response.dto';
import {PossiblyAuthenticatedRequestInterface} from '@shared/interfaces/possibly-authenticated-request.interface';
import {TypeCodeResponseDto} from '@app/auth/dto/type-code-response.dto';
import {Response} from 'express';

@Injectable()
export class AuthService {

  constructor(
    private _configService: ConfigService,
    private _userService: UserService,
    private _jwtService: JwtService,
    private _mailService: MailService
  ) {}

  /**
   * Authenticates the user, updates their preferred language, and sets a JWT access token as httpOnly cookie.
   * @param res - The Express response object used to set the cookie.
   * @param dto - The login request payload containing email, password, and language.
   * @throws UnauthorizedException if credentials are invalid or account is not verified.
   * @throws ForbiddenException if the user account is banned.
   */
  public async login(res: Response, dto: UserLoginRequestDto): Promise<void> {
    const user = await this._validateUserCredentials(dto.email, dto.password);

    if (!user.verified) {
      throw new UnauthorizedException({type: 'UNAUTHORIZED', code: 'ACCOUNT_NOT_VERIFIED'});
    }

    if (user.banned) {
      throw new ForbiddenException({type: 'FORBIDDEN_BANNED_ACCESS', code: 'FORBIDDEN_BANNED_ACCESS'});
    }

    await this._userService.updateOne(user.id, {language: dto.language});

    const payload: JwtPayload = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role
    };
    const access_token = this._jwtService.sign(payload);
    this.setAuthCookie(res, 'access_token', access_token);
  }

  /**
   * Registers a new user account, hashes the password, and sends a verification email.
   * @param userRegisterDto - The registration payload.
   * @returns A promise resolving to the newly created user response.
   * @throws ConflictException if the email address is already registered.
   * @throws InternalServerErrorException if registration or email sending fails.
   */
  public async register(userRegisterDto: UserRegisterRequestDto): Promise<UserResponseDto> {
    const userExists = await this._userService.existsOne(userRegisterDto.email);
    if (userExists) {
      throw new ConflictException({type: 'EMAIL_ALREADY_EXISTS', code: 'EMAIL_ALREADY_EXISTS'});
    }

    if (!this._validateUserRegisterDto(userRegisterDto)) {
      throw new InternalServerErrorException({type: 'REGISTRATION_FAILED', code: 'REGISTRATION_FAILED'});
    }

    userRegisterDto.latitude = Number(userRegisterDto.latitude.toFixed(14));
    userRegisterDto.longitude = Number(userRegisterDto.longitude.toFixed(14));

    const hashedPassword = await bcrypt.hash(userRegisterDto.password, 10);
    const user = this._userService.createOne({...userRegisterDto, password: hashedPassword});

    try {
      const token = this._jwtService.sign({email: user.email} as AccountConfirmationInterface, {
        secret: this._configService.get<string>('JWT_ACCOUNT_VERIFY_SECRET'),
        expiresIn: this._configService.get<string>('JWT_ACCOUNT_VERIFY_SECRET_DURATION')
      });
      await this._mailService.sendUserConfirmation(token, user.email, user.name, user.language);
      return await this._userService.saveOne(user);
    } catch {
      throw new InternalServerErrorException({type: 'REGISTRATION_FAILED', code: 'REGISTRATION_FAILED'});
    }
  }

  /**
   * Validates the account confirmation token and activates the user account.
   * @param token - The JWT confirmation token received with email.
   * @returns A promise resolving to the verification result.
   * @throws BadRequestException if the token is invalid, expired, or account is already verified.
   * @throws NotFoundException if the user does not exist.
   * @throws ForbiddenException if the user is banned.
   */
  public async validateConfirmationToken(token: string): Promise<UserVerifyAccountResponseDto> {
    let decoded: AccountConfirmationInterface;

    try {
      decoded = this._jwtService.verify<AccountConfirmationInterface>(token, {
        secret: this._configService.get<string>('JWT_ACCOUNT_VERIFY_SECRET')
      });
    } catch {
      throw new BadRequestException({type: 'INVALID_OR_EXPIRED_TOKEN', code: 'INVALID_OR_EXPIRED_TOKEN'});
    }

    const user = await this._userService.findOne(decoded.email);
    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    if (user.banned) {
      throw new ForbiddenException({type: 'FORBIDDEN_BANNED_ACCESS', code: 'FORBIDDEN_BANNED_ACCESS'});
    }

    if (user.verified) {
      throw new BadRequestException({type: 'ACCOUNT_ALREADY_VERIFIED', code: 'ACCOUNT_ALREADY_VERIFIED'});
    }

    user.verified = true;
    await this._userService.saveOne(user);
    return {type: 'VERIFICATION_SUCCESS', code: 'VERIFICATION_SUCCESS'};
  }

  /**
   * Initiates the forgotten password flow by generating a reset token and sending it with email.
   * Also stores the request timestamp to prevent token reuse.
   * @param email - The email address of the account requesting a password reset.
   * @param language - The preferred language for the reset email.
   * @returns A promise resolving to a type/code response confirming the email was sent.
   * @throws NotFoundException if the user does not exist.
   * @throws ForbiddenException if the user is banned.
   */
  public async handleForgottenPassword(email: string, language: string): Promise<TypeCodeResponseDto> {
    if (!this._validateUserEmailLength(email)) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    const user = await this._userService.findOne(email);
    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    if (user.banned) {
      throw new ForbiddenException({type: 'FORBIDDEN_BANNED_ACCESS', code: 'FORBIDDEN_BANNED_ACCESS'});
    }

    const requestDateTime = Date.now();
    const token = this._jwtService.sign(
      {
        email: user.email,
        passwordChangeRequestedAt: requestDateTime
      },
      {
        secret: this._configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
        expiresIn: this._configService.get<string>('JWT_RESET_PASSWORD_SECRET_DURATION'),
      }
    );

    await this._userService.updateOne(user.id, {
      passwordChangeRequested: true,
      passwordChangeRequestedAt: requestDateTime,
      language: language
    });
    await this._mailService.sendPasswordReset(token, user.email, user.name, language);
    return {type: 'FORGOTTEN_PASSWORD_INFO', code: 'FORGOTTEN_PASSWORD_INFO'};
  }

  /**
   * Validates whether a password reset token is still valid and the password change is pending.
   * Returns { valid: false } instead of throwing on invalid/expired token or missing user.
   * @param dto - The request payload containing the reset token.
   * @returns A promise resolving to the token validity result.
   * @throws ForbiddenException if the user is banned.
   */
  public async validateSetPasswordToken(dto: ValidateSetNewPasswordRequestDto): Promise<ValidateSetNewPasswordResponseDto> {
    let decoded: AccountForgottenPasswordInterface;

    try {
      decoded = this._jwtService.verify<AccountForgottenPasswordInterface>(dto.token, {
        secret: this._configService.get<string>('JWT_RESET_PASSWORD_SECRET')
      });
    } catch {
      return {valid: false};
    }

    const user = await this._userService.findOne(decoded.email);
    if (!user) {
      return {valid: false};
    }

    if (user.banned) {
      throw new ForbiddenException({type: 'FORBIDDEN_BANNED_ACCESS', code: 'FORBIDDEN_BANNED_ACCESS'});
    }

    return {valid: user.passwordChangeRequested};
  }

  /**
   * Sets a new password for the user after validating the reset token and request timestamp.
   * Clears the passwordChangeRequested flag on success to prevent token reuse.
   * @param dto - The request payload containing the reset token and new password.
   * @returns A promise resolving to a type/code response confirming the password was changed.
   * @throws BadRequestException if the password is too short/long, token is invalid, or password was already changed.
   * @throws NotFoundException if the user does not exist.
   * @throws ForbiddenException if the user is banned.
   */
  public async setNewPassword(dto: SetNewPasswordRequestDto): Promise<TypeCodeResponseDto> {
    if (!this._validateUserPasswordLength(dto.newPassword)) {
      throw new BadRequestException({type: 'INVALID_REQUEST', code: 'INVALID_REQUEST'});
    }

    let decoded: AccountForgottenPasswordInterface;
    try {
      decoded = this._jwtService.verify<AccountForgottenPasswordInterface>(dto.token, {
        secret: this._configService.get<string>('JWT_RESET_PASSWORD_SECRET')
      });
    } catch {
      throw new BadRequestException({type: 'INVALID_OR_EXPIRED_TOKEN', code: 'INVALID_OR_EXPIRED_TOKEN'});
    }

    const user = await this._userService.findOne(decoded.email);
    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    if (user.banned) {
      throw new ForbiddenException({type: 'FORBIDDEN_BANNED_ACCESS', code: 'FORBIDDEN_BANNED_ACCESS'});
    }

    if (!user.passwordChangeRequested) {
      throw new BadRequestException({type: 'PASSWORD_ALREADY_CHANGED', code: 'PASSWORD_ALREADY_CHANGED'});
    }

    const passwordChangeRequestedAtFromToken = decoded.passwordChangeRequestedAt;
    const passwordChangeRequestedAtFromDb = user.passwordChangeRequestedAt;

    if (!passwordChangeRequestedAtFromToken || !passwordChangeRequestedAtFromDb ||
      Number(passwordChangeRequestedAtFromToken) !== Number(passwordChangeRequestedAtFromDb)) {
      throw new BadRequestException({type: 'INVALID_REQUEST', code: 'INVALID_REQUEST'});
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this._userService.updateOne(user.id, {
      password: hashedPassword,
      passwordChangeRequested: false,
      passwordChangeRequestedAt: null
    });

    return {type: 'SET_NEW_PASSWORD_SUCCESS', code: 'SET_NEW_PASSWORD_SUCCESS'};
  }

  /**
   * Returns the current login status based on the request's JWT payload.
   * Clears the auth cookie if the user is banned.
   * @param request - The incoming request, possibly containing an authenticated user.
   * @param res - The Express response object used to clear the cookie if needed.
   * @returns A promise resolving to the login status response.
   */
  public async isUserLoggedInFromRequest(request: PossiblyAuthenticatedRequestInterface, res: Response): Promise<UserLoggedInResponseDto> {
    if (!request?.user) {
      return {isLoggedIn: false};
    }

    const user = await this._userService.findOne(request.user.id);
    if (!user) {
      return {isLoggedIn: false};
    }

    if (user.banned) {
      this.clearAuthCookie(res);
      return {isLoggedIn: false};
    }

    return {isLoggedIn: true};
  }

  /**
   * Updates the preferred language for the authenticated user.
   * @param id - The ID of the user to update.
   * @param language - The new language code to set.
   * @throws NotFoundException if the user does not exist.
   * @throws ForbiddenException if the user is banned.
   */
  public async changeUserLanguage(id: number, language: string): Promise<void> {
    const user = await this._userService.findOne(id);
    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    if (user.banned) {
      throw new ForbiddenException({type: 'FORBIDDEN_BANNED_ACCESS', code: 'FORBIDDEN_BANNED_ACCESS'});
    }

    await this._userService.updateOne(id, {language});
  }

  /**
   * Sets the JWT access token as an httpOnly cookie on the response.
   * Uses secure and sameSite=none in production, lax in development.
   * @param res - The Express response object.
   * @param cookieName - The name of the cookie to set.
   * @param access_token - The JWT token value.
   */
  public setAuthCookie(res: Response, cookieName: string, access_token: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(cookieName, access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: this._configService.get<number>('JWT_ACCESS_SECRET_COOKIE_MAX_AGE')! * 60 * 60 * 1000,
      path: '/',
    } as const);
  }

  /**
   * Clears the JWT access token cookie from the response.
   * @param res - The Express response object.
   */
  public clearAuthCookie(res: Response): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
  }

  /**
   * Validates the registration DTO against allowed field length constraints.
   * @param dto - The registration request payload.
   * @returns True if all fields are within allowed ranges, false otherwise.
   */
  private _validateUserRegisterDto(dto: UserRegisterRequestDto): boolean {
    return (
      dto.name.length > 0 && dto.name.length <= 30 &&
      dto.surname.length > 0 && dto.surname.length <= 30 &&
      this._validateUserEmailLength(dto.email) &&
      this._validateUserPasswordLength(dto.password)
    );
  }

  /**
   * Validates the email length against allowed constraints.
   * @param email - The email string to validate.
   * @returns True if email length is within allowed range.
   */
  private _validateUserEmailLength(email: string): boolean {
    return email.length > 0 && email.length <= 50;
  }

  /**
   * Validates the password length against allowed constraints.
   * @param password - The password string to validate.
   * @returns True if password length is within allowed range.
   */
  private _validateUserPasswordLength(password: string): boolean {
    return password.length >= 8 && password.length <= 60;
  }

  /**
   * Validates user credentials by checking email format, length, and bcrypt password hash.
   * @param email - The email address to validate.
   * @param password - The plain text password to compare against the stored hash.
   * @returns A promise resolving to the matching user entity.
   * @throws UnauthorizedException if credentials are invalid or user does not exist.
   */
  private async _validateUserCredentials(email: string, password: string): Promise<UserEntity> {
    if (isEmail(email) && this._validateUserEmailLength(email) && this._validateUserPasswordLength(password)) {
      const user = await this._userService.findOne(email);
      if (user && (await bcrypt.compare(password, user.password))) {
        return user;
      }
    }

    throw new UnauthorizedException({type: 'UNAUTHORIZED', code: 'INVALID_CREDENTIALS'});
  }
}