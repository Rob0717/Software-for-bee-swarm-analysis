import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {UserService} from '@app/user/user.service';
import {AuthenticatedUserRequest} from '@shared/interfaces/authenticated-request.interface';

/**
 * Guard that verifies that authenticated user exists in the database and is not banned.
 * Should be used after {@link JwtAuthGuard}.
 * Throws ForbiddenException if the user is not found or is banned.
 */
@Injectable()
export class AccessGuard implements CanActivate {

  constructor(
    private _userService: UserService
  ) {}

  /**
   * Checks whether the authenticated user is active and not banned.
   * @param context - The execution context providing access to the HTTP request.
   * @returns True if the user exists and is not banned.
   * @throws ForbiddenException if the user does not exist or is banned.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedUserRequest = context
      .switchToHttp()
      .getRequest();

    if (!request) return false;

    const userEmail = request.user.email;
    const user = await this._userService.findOne(userEmail);

    if (!user || user.banned) {
      throw new ForbiddenException({type: 'FORBIDDEN_BANNED_ACCESS', code: 'FORBIDDEN_BANNED_ACCESS'});
    }

    return true;
  }
}