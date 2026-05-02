import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {ConfigService} from '@nestjs/config';
import {JwtPayload} from '@shared/interfaces/jwt-payload.interface';
import {Request} from 'express';

/**
 * Passport strategy for validating JWT access tokens.
 * Extracts the token from the httpOnly `access_token` cookie on each request.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined in environment variables.');
    }

    super({
      // Extract JWT from the httpOnly cookie instead of the Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.['access_token'] as string ?? null
      ]),
      ignoreExpiration: false,
      secretOrKey: secret
    });
  }

  /**
   * Called by Passport after the token signature is verified.
   * Returns the payload which is then set as request.user.
   * @param payload - The decoded JWT payload.
   * @returns The validated user payload.
   */
  public validate(payload: JwtPayload): JwtPayload {
    return {
      id: payload.id,
      name: payload.name,
      surname: payload.surname,
      email: payload.email,
      role: payload.role
    };
  }
}