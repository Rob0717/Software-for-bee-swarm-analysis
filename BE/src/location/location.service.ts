import {Injectable, OnModuleDestroy} from '@nestjs/common';
import axios, {AxiosResponse} from 'axios';
import {UnifiedQueueItem} from '@app/location/interfaces/unified-queue-item.interface';
import {NominatimResultResponseDto} from '@app/location/dto/nominatim-result-response.dto';
import {getDistance} from 'geolib';

@Injectable()
export class LocationService implements OnModuleDestroy {

  /** Pending requests waiting to be dispatched to the Nominatim API. */
  private _queue: UnifiedQueueItem[] = [];

  /** Cache for address search results, keyed by normalized query string. */
  private _searchCache = new Map<string, NominatimResultResponseDto[]>();

  /** Cache for reverse geocoding results, keyed by "lat:lon" string. */
  private _reverseCache = new Map<string, NominatimResultResponseDto>();

  /** Interval between Nominatim API requests in milliseconds. Nominatim Terms of Service allow max 1 request per second. */
  private _interval = 1000;

  /** Reference to the interval timer used to process the queue. */
  private _processorIntervalId: NodeJS.Timeout | null = null;

  /** User-Agent header sent with every Nominatim request as required by their usage policy. */
  private _userAgent = process.env.USER_AGENT!;

  /** Maximum cache age in milliseconds. */
  private _cacheMaxAge = 3600000; // 1 hour

  /** Timestamps of search cache entries, used for cache expiry checks. */
  private _cacheTimestamps = new Map<string, number>();

  /** Timestamps of reverse geocoding cache entries, used for cache expiry checks. */
  private _reverseCacheTimestamps = new Map<string, number>();

  constructor() {
    this._start();
  }

  onModuleDestroy(): void {
    this._stop();
  }

  /**
   * Searches for addresses matching the given query using the Nominatim API.
   * Returns cached results if available and not expired.
   * Otherwise, queues the request for rate-limited dispatch.
   * @param query - The text query to search for.
   * @returns A promise resolving to a list of matching Nominatim results.
   */
  public async search(query: string): Promise<NominatimResultResponseDto[]> {
    const normalized = query.trim().toLowerCase();

    if (this._isCacheValid(normalized)) {
      return this._searchCache.get(normalized) ?? [];
    } else if (query.length < 3 || query.length > 300) {
      return [];
    }

    return new Promise<NominatimResultResponseDto[]>((resolve, reject) => {
      this._queue.push({type: 'search', query: normalized, resolve, reject});
    });
  }

  /**
   * Resolves geographic coordinates to a human-readable address using the Nominatim reverse geocoding API.
   * Returns cached results if available and not expired.
   * Otherwise, queues the request for rate-limited dispatch.
   * @param lat - Latitude coordinate.
   * @param lon - Longitude coordinate.
   * @returns A promise resolving to the nearest Nominatim result for the given coordinates.
   */
  public async reverseGeocode(lat: number, lon: number): Promise<NominatimResultResponseDto> {
    const cacheKey = `${lat}:${lon}`;

    if (this._isReverseCacheValid(cacheKey)) {
      return this._reverseCache.get(cacheKey) ?? {place_id: 0, display_name: '', lat: '', lon: ''};
    }

    return new Promise<NominatimResultResponseDto>((resolve, reject) => {
      this._queue.push({type: 'reverse', lat, lon, resolve, reject});
    });
  }

  /**
   * Calculates the air distance between two geographic points.
   * @param latitudeSwarm - Latitude of the swarm location.
   * @param longitudeSwarm - Longitude of the swarm location.
   * @param latitudeBeekeeper - Latitude of the beekeeper's location.
   * @param longitudeBeekeeper - Longitude of the beekeeper's location.
   * @returns Distance in kilometers, rounded to 1 meter precision.
   */
  public getAirDistanceInKm(latitudeSwarm: number, longitudeSwarm: number, latitudeBeekeeper: number, longitudeBeekeeper: number): number {
    return getDistance(
      {latitude: latitudeSwarm, longitude: longitudeSwarm},
      {latitude: latitudeBeekeeper, longitude: longitudeBeekeeper},
      1
    ) / 1000;
  }

  /**
   * Starts the queue processor interval.
   * Dispatches one Nominatim request per second to comply with the usage policy.
   */
  private _start(): void {
    this._processorIntervalId = setInterval(() => {
      void this._processNext();
    }, this._interval);
  }

  /**
   * Stops the queue processor interval and clears the timer reference.
   * Called automatically when the NestJS module is destroyed.
   */
  private _stop(): void {
    if (this._processorIntervalId) {
      clearInterval(this._processorIntervalId);
      this._processorIntervalId = null;
    }
  }

  /**
   * Processes the next item in the queue.
   * Delegates to the appropriate handler based on the item type.
   */
  private async _processNext(): Promise<void> {
    const item = this._queue.shift();
    if (!item) return;

    if (item.type === 'search') {
      await this._processSearch(item);
    } else if (item.type === 'reverse') {
      await this._processReverse(item);
    }
  }

  /**
   * Dispatches a search request to the Nominatim API and caches the result.
   * Resolves the queued promise on success, rejects it on failure.
   * @param item - The queue item containing the search query and promise callbacks.
   */
  private async _processSearch(item: UnifiedQueueItem): Promise<void> {
    const query = item.query!;

    try {
      const response: AxiosResponse<NominatimResultResponseDto[]> = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 5,
          },
          headers: {
            'User-Agent': this._userAgent,
            'Accept-Language': 'cs,en',
          },
          timeout: 5000,
        },
      );

      const data = response.data.map((result: NominatimResultResponseDto): NominatimResultResponseDto => ({
        place_id: result.place_id,
        display_name: result.display_name,
        lat: result.lat,
        lon: result.lon
      }));

      this._setCache(query, data);
      item.resolve(data);
    } catch (error) {
      item.reject(error);
    }
  }

  /**
   * Dispatches a reverse geocoding request to the Nominatim API and caches the result.
   * Resolves the queued promise on success, rejects it on failure.
   * @param item - The queue item containing the coordinates and promise callbacks.
   */
  private async _processReverse(item: UnifiedQueueItem): Promise<void> {
    const lat = item.lat!;
    const lon = item.lon!;
    const cacheKey = `${lat}:${lon}`;

    try {
      const response: AxiosResponse<NominatimResultResponseDto> = await axios.get(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            format: 'json',
            lat,
            lon,
            addressdetails: 1,
          },
          headers: {
            'User-Agent': this._userAgent,
            'Accept-Language': 'cs,en',
          },
          timeout: 5000,
        },
      );

      const data: NominatimResultResponseDto = {
        place_id: response.data.place_id,
        display_name: response.data.display_name,
        lat: response.data.lat,
        lon: response.data.lon
      };

      this._setReverseCache(cacheKey, data);
      item.resolve(data);
    } catch (error) {
      item.reject(error);
    }
  }

  /**
   * Stores a search result in the cache along with its timestamp.
   * @param key - The normalized search query used as the cache key.
   * @param value - The list of Nominatim results to cache.
   */
  private _setCache(key: string, value: NominatimResultResponseDto[]): void {
    this._searchCache.set(key, value);
    this._cacheTimestamps.set(key, Date.now());
  }

  /**
   * Stores a reverse geocoding result in the cache along with its timestamp.
   * @param key - The "lat:lon" string used as the cache key.
   * @param value - The Nominatim result to cache.
   */
  private _setReverseCache(key: string, value: NominatimResultResponseDto): void {
    this._reverseCache.set(key, value);
    this._reverseCacheTimestamps.set(key, Date.now());
  }

  /**
   * Checks whether a search cache entry is still valid (not expired).
   * @param key - The cache key to check.
   * @returns True if the entry exists and has not exceeded the max cache age.
   */
  private _isCacheValid(key: string): boolean {
    const timestamp = this._cacheTimestamps.get(key);
    if (!timestamp || !this._searchCache.has(key)) return false;
    return Date.now() - timestamp < this._cacheMaxAge;
  }

  /**
   * Checks whether a reverse geocoding cache entry is still valid (not expired).
   * @param key - The cache key to check.
   * @returns True if the entry exists and has not exceeded the max cache age.
   */
  private _isReverseCacheValid(key: string): boolean {
    const timestamp = this._reverseCacheTimestamps.get(key);
    if (!timestamp || !this._reverseCache.has(key)) return false;
    return Date.now() - timestamp < this._cacheMaxAge;
  }
}