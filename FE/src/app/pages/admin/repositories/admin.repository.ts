import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ManageUserAccessRequestDto} from '@shared/models/generated-dtos/manage-user-access-request-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';
import {environment} from '../../../../../environment';

/**
 * Repository responsible for admin-related HTTP communication.
 * Provides direct access to the admin user management API endpoints.
 */
@Injectable({providedIn: 'root'})
export class AdminRepository {

  constructor(
    private _httpClient: HttpClient
  ) {}

  /**
   * Fetches all beekeeper users from the API.
   * @returns An observable resolving to an array of user response objects.
   */
  public getAllBeekeepers$(): Observable<UserResponseDto[]> {
    return this._httpClient.get<UserResponseDto[]>(
      `${environment.apiUrl}/users`
    )
  }

  /**
   * Updates access permissions for a specific user.
   * @param id - The ID of the user to update.
   * @param dto - The request payload containing the new access settings.
   * @returns An observable that completes when the update is successful.
   */
  public manageUserAccess$(id: number, dto: ManageUserAccessRequestDto): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}/users/${id}`,
      dto
    )
  }
}
