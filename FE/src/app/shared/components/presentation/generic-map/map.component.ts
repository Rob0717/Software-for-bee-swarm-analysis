import {CommonModule} from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslocoPipe} from '@jsverse/transloco';
import {
  Map as LeafletMap,
  Marker,
  LatLngBoundsExpression,
  MapOptions,
  icon,
  map,
  tileLayer,
  marker,
  LeafletMouseEvent,
  circle,
  Circle
} from 'leaflet';
import {PrimeTemplate} from 'primeng/api';
import {AutoComplete, AutoCompleteSelectEvent} from 'primeng/autocomplete';
import {Button} from 'primeng/button';
import {Message} from 'primeng/message';
import {Tooltip} from 'primeng/tooltip';
import {asyncScheduler, Observable, of, Subject, switchMap, takeUntil} from 'rxjs';
import {LocationFacade} from '@shared/facades/location.facade';
import {NominatimResultResponseDto} from '@shared/models/generated-dtos/nominatim-result-response-dto';
import {LocationDataModel} from '@shared/models/location-data.model';
import {MapConfigModel} from '@shared/models/map-config.model';

/**
 * Generic reusable map component based on Leaflet and OpenStreetMap.
 *
 * Supports two modes:
 * - `select` — user can click the map or search for an address to select a location
 * - `display` — read-only map for displaying one or more markers
 *
 * Emits selected location(s) with `locationSelected` and `locationsSelected` outputs.
 * Supports optional radius circles, geolocation, address search, and multi-marker mode.
 */
@Component({
  standalone: true,
  selector: 'app-generic-map',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoPipe,
    AutoComplete,
    PrimeTemplate,
    Message,
    Button,
    Tooltip
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {

  /** Reference to the map container DOM element. */
  @ViewChild('mapContainer', {static: true}) mapContainer!: ElementRef;

  /** Reference to the address search autocomplete component. */
  @ViewChild('autoComplete') autoComplete!: AutoComplete;

  /** Emits when a single location is selected (select mode or reverse geocode completes). */
  @Output() locationSelected = new EventEmitter<LocationDataModel>();

  /** Emits the full list of selected locations whenever it changes (multi-marker mode). */
  @Output() locationsSelected = new EventEmitter<LocationDataModel[]>();

  /** Emits when an existing marker is clicked by the user. */
  @Output() locationClicked = new EventEmitter<LocationDataModel>();

  /** Observable that triggers a full map reset when it emits. */
  @Input() clear: Observable<void> = of();

  /** A single initial location to display on the map after view initialization. */
  @Input() initialLocation?: LocationDataModel;

  /**
   * A list of initial locations to display as markers.
   * If the map is already initialized when this input changes, markers are updated immediately.
   */
  @Input() set initialLocations(locations: LocationDataModel[] | undefined) {
    this._initialLocations = locations;
    if (locations && this.map) {
      this._updateLocations(locations);
    }
  }

  get initialLocations(): LocationDataModel[] | undefined {
    return this._initialLocations;
  }

  /** CSS height of the map container. Defaults to `400px`. */
  @Input() mapHeight: string = '400px';

  /** Map behavior and display configuration. */
  @Input() config: MapConfigModel = {
    mode: 'display',
    showSearch: false,
    showRadius: false,
    radiusInMeters: 1000,
    radiusColor: '#2563eb',
    showChosenLocation: false,
    showCurrentLocation: false,
    showMarkerInfo: false,
    allowMultipleMarkers: false,
    readonly: false,
    defaultZoom: 13
  };

  /** The currently entered or selected address in the search field. */
  public selectedAddress: string | NominatimResultResponseDto = '';

  /** Address suggestions returned by the Nominatim search. */
  public suggestions: NominatimResultResponseDto[] = [];

  /** The currently selected location in single-marker mode. */
  public selectedLocation?: LocationDataModel;

  /** The list of currently selected locations in multi-marker mode. */
  public selectedLocations: LocationDataModel[] = [];

  /** Whether the last address search or reverse geocode resulted in an error. */
  public searchError: boolean = false;

  /** Whether the browser geolocation request failed or is unsupported. */
  public geolocationError: boolean = false;

  /** Whether the geolocation request is currently in progress. */
  public loadingCurrentLocation: boolean = false;

  /** Whether the address search request is currently in progress. */
  public searchLoading: boolean = false;

  /** The Leaflet map instance. */
  private map!: LeafletMap;

  /** Map of active markers keyed by their `lat-lon` identifier (or `'default'` in single-marker mode). */
  private markers = new Map<string, Marker>();

  /** Subject that triggers the debounced address search. */
  private _searchSubject = new Subject<string>();

  /** Flag used to prevent opening of autocomplete dropdown on searching address with enter key. */
  private _addressSelectedWithEnter = false;

  /** Observer that calls `invalidateSize()` when the map container is resized. */
  private _resizeObserver?: ResizeObserver;

  /** Map of active radius circles keyed by their `lat-lon` identifier. */
  private _circles = new Map<string, Circle>();

  /** Field for the `initialLocations` input setter. */
  private _initialLocations?: LocationDataModel[];

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _locationFacade: LocationFacade
  ) {}

  ngOnInit(): void {
    if (this.config.showSearch) {
      this._setupSearch();
    }
  }

  ngAfterViewInit(): void {
    this._initializeMap();
    this._resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    });
    this._resizeObserver.observe(this.mapContainer.nativeElement);
    this.clear
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.clearLocation());

    /** Used to allow the map to fully render before placing initial markers. */
    asyncScheduler.schedule(() => {
      if (this.initialLocation) {
        this._addLocation(this.initialLocation);
      }
      if (this._initialLocations && this.config.allowMultipleMarkers) {
        this._updateLocations(this._initialLocations);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._resizeObserver?.disconnect();
    this._clearMarkers();
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Initializes the Leaflet map instance with tile layer, bounds, default icon,
   * and a click handler for select mode.
   */
  private _initializeMap(): void {
    const czechBounds: LatLngBoundsExpression = [
      [48.5, 12.0],
      [51.1, 18.9]
    ];

    Marker.prototype.options.icon = icon({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    const mapOptions: MapOptions = {
      minZoom: 7,
      maxZoom: 19,
      maxBounds: czechBounds,
      maxBoundsViscosity: 1.0
    };

    this.map = map(this.mapContainer.nativeElement, mapOptions).setView(
      [50.0755, 14.4378],
      this.config.defaultZoom || 13
    );

    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    if (!this.config.readonly) {
      this.map.on('click', (e: LeafletMouseEvent) => {
        this._handleMapClick(e.latlng.lat, e.latlng.lng);
      });
    }
  }

  /**
   * Draws a radius circle around the given coordinates.
   * The `radius` parameter is expected in kilometers and is converted to meters.
   * Falls back to `config.radiusInMeters` if no radius is provided.
   * Does nothing if `showRadius` is disabled or no radius value is available.
   * @param lat - Latitude of the circle center.
   * @param lon - Longitude of the circle center.
   * @param radius - Optional apiary radius in kilometers.
   */
  private _addRadiusCircle(lat: number, lon: number, radius?: number): void {
    let radiusMeters = radius || this.config.radiusInMeters;
    if (!this.config.showRadius || !radiusMeters) return;
    if (radius) {
      radiusMeters = radius * 1000;
    }

    const circleId = `${lat}-${lon}`;
    if (this._circles.has(circleId)) {
      this.map.removeLayer(this._circles.get(circleId)!);
      this._circles.delete(circleId);
    }

    const radiusCircle = circle([lat, lon], {
      radius: radiusMeters,
      color: this.config.radiusColor ?? '#2563eb',
      fillColor: this.config.radiusColor ?? '#2563eb',
      fillOpacity: 0.15,
      weight: 2
    }).addTo(this.map);

    this._circles.set(circleId, radiusCircle);
  }

  /**
   * Forces the autocomplete dropdown open and clears any loading state.
   * Used to manually trigger the suggestion panel on dropdown button click.
   */
  public onDropdownClick(): void {
    this.autoComplete.loading = false;
    this.autoComplete.show();
  }

  /**
   * Pushes the current search query into the search pipeline.
   * Clears suggestions immediately if the query is empty or already a selected object.
   */
  public performSearch(): void {
    if (this.searchLoading) {
      return;
    }

    if (this._addressSelectedWithEnter) {
      this._addressSelectedWithEnter = false;
      return;
    }

    this.searchLoading = true;
    const query = this.selectedAddress;
    if (!query || typeof query === 'object') {
      this.suggestions = [];
      this.searchLoading = false;
      return;
    }

    /** Prevents multiple clicks on search button. */
    asyncScheduler.schedule(() => {
      this._searchSubject.next(query);
    }, 1000);
  }

  /**
   * Handles a map click event and takes the appropriate action based on the current mode.
   * @param lat - Latitude of the click in the map.
   * @param lon - Longitude of the click in the map.
   */
  private _handleMapClick(lat: number, lon: number): void {
    switch (this.config.mode) {
      case 'select':
        this._setMarkerAndReverse(lat, lon);
        break;
      case 'display':
      default:
        break;
    }
  }

  /**
   * Clears all existing markers and places a new one at the given coordinates,
   * then initiates reverse geocoding.
   * @param lat - Latitude of the new marker.
   * @param lon - Longitude of the new marker.
   */
  private _setMarkerAndReverse(lat: number, lon: number): void {
    this._clearMarkers();
    this._addMarkerAndReverse(lat, lon);
  }

  /**
   * Places a marker at the given coordinates and triggers reverse geocoding.
   * Uses `lat-lon` as the marker ID in multi-marker mode, or `'default'` in single-marker mode.
   * @param lat - Latitude of the marker.
   * @param lon - Longitude of the marker.
   */
  private _addMarkerAndReverse(lat: number, lon: number): void {
    const markerId = this.config.allowMultipleMarkers ? `${lat}-${lon}` : 'default';
    const newMarker = marker([lat, lon]).addTo(this.map);
    this.markers.set(markerId, newMarker);

    this._addLocation({address: '', latitude: lat, longitude: lon, displayName: ''});
    this._reverseGeocode(lat, lon);
  }

  /**
   * Sets up the address search pipeline using the search subject.
   * Debounces input with `distinctUntilChanged`, cancels in-flight requests with `switchMap`,
   * and skips queries shorter than 3 characters.
   */
  private _setupSearch(): void {
    this._searchSubject
      .pipe(
        switchMap(query => {
          if (!query || query.length < 3 || query.length > 300) {
            this.searchLoading = false;
            return of([]);
          }
          this.searchLoading = true;
          return this._locationFacade.searchAddress$(query);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (results) => {
          this.suggestions = results;
          this.searchError = false;
          this.searchLoading = false;
          this.onDropdownClick();
        },
        error: () => {
          this.searchError = true;
          this.suggestions = [];
          this.searchLoading = false;
          this.onDropdownClick();
        }
      });
  }

  /**
   * Handles selection of an address suggestion from the autocomplete dropdown.
   * Clears existing markers first in single-marker mode, then adds the new location.
   * @param event - The autocomplete select event containing the chosen Nominatim result.
   */
  public onAddressSelect(event: AutoCompleteSelectEvent): void {
    if (event.originalEvent instanceof KeyboardEvent) {
      if (event.originalEvent.key === 'Enter') {
        this._addressSelectedWithEnter = true;
      }
    }

    const result = event.value as NominatimResultResponseDto;
    const lat = Number(Number(result.lat).toFixed(14));
    const lon = Number(Number(result.lon).toFixed(14));

    if (!this.config.allowMultipleMarkers) {
      this._clearMarkers();
    }

    this._addLocation({
      address: result.display_name,
      latitude: lat,
      longitude: lon,
      displayName: result.display_name
    });

    this.selectedAddress = result.display_name;
    this.map.setView([lat, lon], 19);

    /** Short timeout for dropdown closure before suggestions removal. */
    asyncScheduler.schedule(() => this.suggestions = [], 200);
  }

  /**
   * Performs reverse geocoding for the given coordinates and updates the selected location.
   * Emits the resolved location with `locationSelected` and updates the search field.
   * @param lat - Latitude to reverse geocode.
   * @param lon - Longitude to reverse geocode.
   */
  private _reverseGeocode(lat: number, lon: number): void {
    this._locationFacade.reverseGeocode$(lat, lon)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (result) => {
          const location: LocationDataModel = {
            address: result.display_name,
            latitude: lat,
            longitude: lon,
            displayName: result.display_name
          };
          this.selectedLocation = location;
          this.locationSelected.emit(location);
          this.selectedAddress = result.display_name;
          this.searchError = false;
          this.map.setView([lat, lon], 19);
        },
        error: () => {
          this.searchError = true;
          this.map.setView([lat, lon], 19);
        }
      });
  }

  /**
   * Requests the user's current position with the browser Geolocation API,
   * places a marker at the result, and initiates reverse geocoding.
   * Sets `geolocationError` if geolocation is unavailable or the request fails.
   */
  public getCurrentLocation(): void {
    this._clearMarkers();
    if (!navigator.geolocation) {
      this.geolocationError = true;
      return;
    }

    this.loadingCurrentLocation = true;
    this.geolocationError = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(14));
        const lon = Number(position.coords.longitude.toFixed(14));
        this._addLocation({address: '', latitude: lat, longitude: lon, displayName: ''});
        this._reverseGeocode(lat, lon);
        this.loadingCurrentLocation = false;
      },
      () => {
        this.geolocationError = true;
        this.loadingCurrentLocation = false;
      }
    );
  }

  /**
   * Clears all selected locations, markers, and the search field.
   * Emits empty values with `locationSelected` and `locationsSelected`.
   */
  public clearLocation(): void {
    this.selectedLocation = undefined;
    this.selectedLocations = [];
    this.selectedAddress = '';
    this.suggestions = [];
    this._clearMarkers();
    this.locationSelected.emit(undefined);
    this.locationsSelected.emit([]);
  }

  /**
   * Removes a specific location marker from the map and from the selected locations list.
   * Emits the updated locations list with `locationsSelected`.
   * @param location - The location to remove.
   */
  public removeLocation(location: LocationDataModel): void {
    const markerId = `${location.latitude}-${location.longitude}`;
    const existingMarker = this.markers.get(markerId);
    const existingCircle = this._circles.get(markerId);

    if (existingMarker) {
      this.map.removeLayer(existingMarker);
      this.markers.delete(markerId);
    }

    if (existingCircle) {
      this.map.removeLayer(existingCircle);
      this._circles.delete(markerId);
    }

    this.selectedLocations = this.selectedLocations.filter(
      loc => !(loc.latitude === location.latitude && loc.longitude === location.longitude)
    );

    this.locationsSelected.emit(this.selectedLocations);
  }

  /**
   * Removes all markers and radius circles from the map and clears their internal maps.
   */
  private _clearMarkers(): void {
    this.markers.forEach((m: Marker) => this.map.removeLayer(m));
    this.markers.clear();

    this._circles.forEach((c: Circle) => this.map.removeLayer(c));
    this._circles.clear();
  }

  /**
   * Adds a location marker to the map if one does not already exist at those coordinates.
   * Optionally binds a popup with apiary info, attaches a click emitter,
   * and draws a radius circle if configured.
   * Updates `selectedLocation` or `selectedLocations` depending on the marker mode.
   * @param location - The location data to add.
   */
  private _addLocation(location: LocationDataModel): void {
    const markerId = `${location.latitude}-${location.longitude}`;
    if (this.markers.has(markerId)) return;

    const _marker: Marker = marker([location.latitude, location.longitude]).addTo(this.map);

    if (this.config.showMarkerInfo) {
      let popupContent = location.displayName ?? '';
      if (location.latitude && location.longitude) {
        popupContent += `<br><br><small>${location.latitude},${location.longitude}</small>`
      }
      if (location.apiaryName) {
        popupContent = `<strong style="display: block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">${location.apiaryName}</strong><br>${location.address || ''}`;
        if (location.apiaryRadius) {
          popupContent += `<br><small>Radius: ${location.apiaryRadius}km</small>`;
        }
      }
      _marker.bindPopup(popupContent);
    }

    _marker.on('click', () => this.locationClicked.emit(location));
    this.markers.set(markerId, _marker);
    this._addRadiusCircle(location.latitude, location.longitude, location.apiaryRadius);

    if (!this.config.allowMultipleMarkers) {
      this.selectedLocation = location;
      this.locationSelected.emit(location);
    } else {
      if (!this.selectedLocations.find(l => l.latitude === location.latitude && l.longitude === location.longitude)) {
        this.selectedLocations.push(location);
      }
      this.locationsSelected.emit(this.selectedLocations);
    }
  }

  /**
   * Replaces all current markers with the provided locations and fits the map bounds.
   * Skips if the map has not been initialized yet.
   * @param locations - The new set of locations to display.
   */
  private _updateLocations(locations: LocationDataModel[]): void {
    if (!this.map) return;
    this._clearMarkers();
    locations.forEach(loc => this._addLocation(loc));
    if (this.config.autoFitBounds !== false && locations.length > 0) {
      this.map.invalidateSize();
      this._fitBoundsToMarkers();
    }
  }

  /**
   * Adjusts the map view to fit all current markers within the viewport.
   * For a single marker, centers the map at zoom level 11.
   * For multiple markers, uses `fitBounds` with padding.
   * When radius circles are present, their bounds are used instead of the marker coordinates.
   */
  private _fitBoundsToMarkers(): void {
    if (!this.map || this.markers.size === 0) return;
    const bounds: [number, number][] = [];

    this.markers.forEach((marker, markerId) => {
      const latLng = marker.getLatLng();
      const circle = this._circles.get(markerId);
      if (circle) {
        const cb = circle.getBounds();
        bounds.push([cb.getSouthWest().lat, cb.getSouthWest().lng]);
        bounds.push([cb.getNorthEast().lat, cb.getNorthEast().lng]);
      } else {
        bounds.push([latLng.lat, latLng.lng]);
      }
    });

    if (bounds.length === 0) return;

    if (this.markers.size === 1) {
      const firstMarker = this.markers.values().next().value;
      if (firstMarker) {
        const latLng = firstMarker.getLatLng();
        this.map.setView([latLng.lat, latLng.lng], 11);
      }
    } else {
      this.map.fitBounds(bounds as LatLngBoundsExpression, {
        padding: [80, 80],
        maxZoom: 11
      });
    }
  }
}
