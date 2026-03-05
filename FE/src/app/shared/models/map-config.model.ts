import {MapModeType} from '@shared/models/map-mode.type';

export type MapConfigModel = {
  mode: MapModeType;
  showSearch?: boolean;
  showChosenLocation?: boolean;
  showCurrentLocation?: boolean;
  showMarkerInfo?: boolean;
  allowMultipleMarkers?: boolean;
  readonly?: boolean;
  defaultZoom?: number;
  showRadius?: boolean;
  radiusInMeters?: number;
  radiusColor?: string;
  autoFitBounds?: boolean;
};
