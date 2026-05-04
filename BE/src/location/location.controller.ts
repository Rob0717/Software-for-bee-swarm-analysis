import {Controller, Get, ParseFloatPipe, Query} from '@nestjs/common';
import {LocationService} from '@app/location/location.service';
import {ApiOkResponse, ApiOperation, ApiQuery, ApiTags} from '@nestjs/swagger';
import {NominatimResultResponseDto} from '@app/location/dto/nominatim-result-response.dto';

@ApiTags('location')
@Controller('location')
export class LocationController {

  constructor(
    private _locationService: LocationService
  ) {}

  /**
   * Searches for addresses matching the given text query using the Nominatim API.
   * Results are cached for 1 hour and requests are rate-limited to 1 per second.
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search address by text query',
    description: 'Uses the Nominatim API to search for addresses matching the given text query. Results are cached for 1 hour.',
  })
  @ApiQuery({
    name: 'searchQuery',
    type: String,
    required: true,
    example: 'Plzen',
    description: 'Text query used to search for an address.',
  })
  @ApiOkResponse({
    description: 'List of addresses matching the given query.',
    type: NominatimResultResponseDto,
    isArray: true,
  })
  public search(@Query('searchQuery') searchQuery: string): Promise<NominatimResultResponseDto[]> {
    return this._locationService.search(searchQuery);
  }

  /**
   * Converts geographic coordinates into a human-readable address using the Nominatim reverse geocoding API.
   * Results are cached for 1 hour and requests are rate-limited to 1 per second.
   */
  @Get('reverse')
  @ApiOperation({
    summary: 'Reverse geocoding — get address by coordinates',
    description: 'Converts geographic coordinates (latitude and longitude) into a human-readable address using the Nominatim API.',
  })
  @ApiQuery({
    name: 'lat',
    type: Number,
    required: true,
    example: 49.7384,
    description: 'Latitude coordinate.',
  })
  @ApiQuery({
    name: 'lon',
    type: Number,
    required: true,
    example: 13.3736,
    description: 'Longitude coordinate.',
  })
  @ApiOkResponse({
    description: 'Returns the address corresponding to the given coordinates.',
    type: NominatimResultResponseDto,
  })
  public reverse(@Query('lat', ParseFloatPipe) lat: number, @Query('lon', ParseFloatPipe) lon: number): Promise<NominatimResultResponseDto> {
    return this._locationService.reverseGeocode(lat, lon);
  }
}