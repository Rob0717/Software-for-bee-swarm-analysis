import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

/**
 * Guard that validates the JWT access token from the httpOnly cookie.
 * Uses the 'jwt' Passport strategy defined in {@link JwtAccessStrategy}.
 * Throws UnauthorizedException if the token is missing, invalid, or expired.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}