import {CustomDecorator, SetMetadata} from '@nestjs/common';
import {UserRole} from '@shared/enums/user-role.enum';

/** Metadata key used by RolesGuard to read the required roles from route metadata. */
export const ROLES_KEY = 'roles';

/**
 * Route decorator that attaches required role metadata to a controller.
 * Used in combination with {@link RolesGuard} to restrict access to specific user roles.
 *
 * @example
 * \@Roles(UserRole.ADMIN)
 * \@UseGuards(JwtAuthGuard, RolesGuard)
 * public async deleteReport(): Promise<void> { ... }
 */
export const Roles = (...roles: UserRole[]): CustomDecorator => SetMetadata(ROLES_KEY, roles);