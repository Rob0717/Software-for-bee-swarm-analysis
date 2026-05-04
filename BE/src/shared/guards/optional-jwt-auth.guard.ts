import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

/**
 * Optional variant of {@link JwtAuthGuard}.
 * Attempts to validate the JWT access token from the httpOnly cookie,
 * but does not throw if the token is missing or invalid.
 * Used for endpoints that behave differently for authenticated vs unauthenticated users.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {

  /**
   * Overrides the default error handling to suppress authentication errors.
   * Returns the authenticated user if present, or null if authentication failed.
   * @param _err - The authentication error, ignored intentionally.
   * @param user - The authenticated user object, or false/null/undefined if not authenticated.
   * @returns The authenticated user, or null if not authenticated.
   */
  override handleRequest<TUser = unknown>(
    _err: unknown,
    user: TUser | false | null | undefined
  ): TUser | null {
    return user && user !== false ? (user as TUser) : null;
  }
}