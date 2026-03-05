import {Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {AdminRepository} from '@app/pages/admin/repositories/admin.repository';
import {ManageUserAccessRequestDto} from '@shared/models/generated-dtos/manage-user-access-request-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';

/**
 * Facade for admin-related operations.
 * Acts as an abstraction layer between admin UI components and the repository.
 */
@Injectable({providedIn: 'root'})
export class AdminFacade {

  constructor(
    private _adminRepository: AdminRepository
  ) {}

  /**
   * Retrieves a list of all registered beekeepers.
   * @returns A promise resolving to an array of beekeeper user objects.
   */
  public async getAllBeekeepers(): Promise<UserResponseDto[]> {
    return await firstValueFrom(this._adminRepository.getAllBeekeepers$());
  }

  /**
   * Updates access permissions for a specific user.
   * @param id - The ID of the user whose access is being managed.
   * @param dto - The request payload containing the new access settings.
   * @returns A promise resolving to the updated user access.
   */
  public async manageUserAccess(id: number, dto: ManageUserAccessRequestDto): Promise<void> {
    return await firstValueFrom(this._adminRepository.manageUserAccess$(id, dto));
  }
}
