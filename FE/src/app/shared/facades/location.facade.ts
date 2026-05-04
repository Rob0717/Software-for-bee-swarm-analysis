import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {NominatimResultResponseDto} from '@shared/models/generated-dtos/nominatim-result-response-dto';
import {LocationRepository} from '@shared/repositories/location.repository';

/**
 * Facade for location search and reverse geocoding operations.
 * Acts as an abstraction layer between map components and the location repository.
 */
@Injectable({providedIn: 'root'})
export class LocationFacade {

  constructor(
    private _locationRepository: LocationRepository
  ) {}

  /**
   * Searches for addresses matching the given query string with the Nominatim API.
   * @param query - The address search query.
   * @returns An observable resolving to an array of matching Nominatim results.
   */
  public searchAddress$(query: string): Observable<NominatimResultResponseDto[]> {
    return this._locationRepository.searchAddress$(query);
  }

  /**
   * Resolves geographic coordinates to a human-readable address (reverse geocoding).
   * @param lat - Latitude coordinate.
   * @param lon - Longitude coordinate.
   * @returns An observable resolving to the nearest Nominatim result for the given coordinates.
   */
  public reverseGeocode$(lat: number, lon: number): Observable<NominatimResultResponseDto> {
    return this._locationRepository.reverseGeocode$(lat, lon);
  }
}
