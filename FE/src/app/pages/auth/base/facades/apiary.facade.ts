import {Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {ApiaryRepository} from '@app/pages/auth/persistent/repositories/apiary.repository';
import {ApiaryCreateRequestDto} from '@shared/models/generated-dtos/apiary-create-request-dto';
import {ApiaryCreateResponseDto} from '@shared/models/generated-dtos/apiary-create-response-dto';

/**
 * Facade for apiary-related operations.
 * Acts as an abstraction layer between apiary UI components and the repository.
 */
@Injectable({providedIn: 'root'})
export class ApiaryFacade {

  constructor(
    private _apiaryRepository: ApiaryRepository
  ) {}

  /**
   * Creates a new apiary for the currently authenticated user.
   * @param dto - The request payload containing the apiary details.
   * @returns A promise resolving to the created apiary data.
   */
  public createApiary(dto: ApiaryCreateRequestDto): Promise<ApiaryCreateResponseDto> {
    return firstValueFrom(this._apiaryRepository.createApiary$(dto));
  }

  /**
   * Retrieves all apiaries belonging to the currently authenticated user.
   * @returns A promise resolving to an array of the user's apiaries.
   */
  public getApiariesByUser(): Promise<ApiaryCreateResponseDto[]> {
    return firstValueFrom(this._apiaryRepository.getApiariesByUser$());
  }

  /**
   * Deletes a specific apiary by its ID for the currently authenticated user.
   * @param id - The ID of the apiary to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  public deleteApiaryFromUserById(id: number): Promise<void> {
    return firstValueFrom(this._apiaryRepository.deleteApiaryFromUserById$(id));
  }
}
