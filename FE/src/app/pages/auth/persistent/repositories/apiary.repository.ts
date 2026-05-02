import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiaryCreateRequestDto} from '@shared/models/generated-dtos/apiary-create-request-dto';
import {ApiaryCreateResponseDto} from '@shared/models/generated-dtos/apiary-create-response-dto';
import {environment} from '../../../../../../environment';

/**
 * Repository responsible for apiary-related HTTP communication.
 * Provides direct access to the apiary management API endpoints.
 */
@Injectable({providedIn: 'root'})
export class ApiaryRepository {

  constructor(
    private _httpClient: HttpClient
  ) {}

  /**
   * Creates a new apiary for the currently authenticated user.
   * @param dto - The request payload containing apiary details.
   * @returns An observable resolving to the created apiary data.
   */
  public createApiary$(dto: ApiaryCreateRequestDto): Observable<ApiaryCreateResponseDto> {
    return this._httpClient.post<ApiaryCreateResponseDto>(
      `${environment.apiUrl}/apiaries/apiary`,
      {
        apiaryName: dto.apiaryName,
        apiaryRadius: dto.apiaryRadius,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto?.address
      }
    );
  }

  /**
   * Retrieves all apiaries belonging to the currently authenticated user.
   * @returns An observable resolving to an array of the user's apiaries.
   */
  public getApiariesByUser$(): Observable<ApiaryCreateResponseDto[]> {
    return this._httpClient.get<ApiaryCreateResponseDto[]>(
      `${environment.apiUrl}/apiaries/user`
    );
  }

  /**
   * Deletes a specific apiary by its ID.
   * @param id - The ID of the apiary to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  public deleteApiaryFromUserById$(id: number): Observable<void> {
    return this._httpClient.delete<void>(
      `${environment.apiUrl}/apiaries/${encodeURIComponent(id)}`,
    );
  }
}
