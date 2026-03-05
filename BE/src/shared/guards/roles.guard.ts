import {Injectable, CanActivate, ExecutionContext, ForbiddenException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {UserRole} from '@shared/enums/user-role.enum';
import {AuthenticatedUserRequest} from '@shared/interfaces/authenticated-request.interface';
import {ROLES_KEY} from '@shared/decorators/roles.decorator';
import {UserService} from '@app/user/user.service';

/**
 * Guard that restricts route access based on the user's role.
 * Reads required roles from route metadata set by the {@link Roles} decorator.
 * Should be used after {@link JwtAuthGuard} and {@link AccessGuard}.
 * Throws ForbiddenException if the user's role is not in the list of required roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {

  constructor(
    private _reflector: Reflector,
    private _userService: UserService
  ) {}

  /**
   * Checks whether the authenticated user has one of the required roles for the route.
   * If no roles are defined on the route, access is granted unconditionally.
   * @param context - The execution context providing access to the HTTP request and route metadata.
   * @returns True if the user has a required role.
   * @throws ForbiddenException if the user does not have a required role.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this._reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // No roles defined on this route — allow access unconditionally
    if (!requiredRoles) {
      return true;
    }

    const request: AuthenticatedUserRequest = context
      .switchToHttp()
      .getRequest();

    if (!request) return false;

    const user = await this._userService.findOne(request.user.id);

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException();
    }

    return true;
  }
}