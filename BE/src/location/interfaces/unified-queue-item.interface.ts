import {QueueItemType} from '@app/location/types/queue-item.type';
import {NominatimResultResponseDto} from '@app/location/dto/nominatim-result-response.dto';

export interface UnifiedQueueItem {
  type: QueueItemType;
  query?: string;
  lat?: number;
  lon?: number;
  resolve: (value:
    NominatimResultResponseDto |
    PromiseLike<NominatimResultResponseDto> |
    NominatimResultResponseDto[] |
    PromiseLike<NominatimResultResponseDto[]>) => void;
  reject: (reason: unknown) => void;
}