import {Injectable, PipeTransform} from '@nestjs/common';
import {sanitizeAny} from '@shared/sanitizers/sanitize-any';

/**
 * NestJS pipe that recursively sanitizes all string values in the incoming request body.
 * Handles nested objects and arrays via {@link sanitizeAny}.
 */
@Injectable()
export class SanitizeStringsPipe implements PipeTransform {

  /**
   * Transforms the incoming value by sanitizing all string fields recursively.
   * @param value - The raw request body or parameter value.
   * @returns The sanitized value with the same structure.
   */
  transform(value: unknown): unknown {
    return sanitizeAny(value);
  }
}