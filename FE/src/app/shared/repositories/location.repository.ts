import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {NominatimResultResponseDto} from '@shared/models/generated-dtos/nominatim-result-response-dto';
import {environment} from '../../../../environment';

/**
 * Repository service responsible for location-related HTTP communication.
 */
@Injectable({providedIn: 'root'})
export class LocationRepository {

  constructor(
    private _httpClient: HttpClient
  ) {}

  /**
   * Searches for addresses matching the given query string.
   * @param searchQuery - The address search query.
   * @returns An observable resolving to an array of matching Nominatim results.
   */
  public searchAddress$(searchQuery: string): Observable<NominatimResultResponseDto[]> {
    const params = new HttpParams().set('searchQuery', searchQuery);

    return this._httpClient.get<NominatimResultResponseDto[]>(
      `${environment.apiUrl}/location/search`,
      {params}
    );
  }

  /**
   * Resolves geographic coordinates to a human-readable address (reverse geocoding).
   * @param lat - Latitude coordinate.
   * @param lon - Longitude coordinate.
   * @returns An observable resolving to the nearest Nominatim result for the given coordinates.
   */
  public reverseGeocode$(lat: number, lon: number): Observable<NominatimResultResponseDto> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());

    return this._httpClient.get<NominatimResultResponseDto>(
      `${environment.apiUrl}/location/reverse`,
      {params}
    );
  }
}
