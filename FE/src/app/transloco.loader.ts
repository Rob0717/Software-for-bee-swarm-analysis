import {HttpClient} from '@angular/common/http';
import {inject} from '@angular/core';
import {TranslocoLoader, Translation} from '@jsverse/transloco';
import {Observable} from 'rxjs';

/**
 * Transloco loader that fetches translation files over HTTP.
 * Loads JSON translation files from the `assets/i18n/` directory by language code.
 */
export class TranslocoHttpLoader implements TranslocoLoader {

  private _httpClient = inject(HttpClient);

  /**
   * Loads the translation file for the given language code.
   * @param lang - The language code to load.
   * @returns An observable resolving to the translation object.
   */
  getTranslation(lang: string): Observable<Translation> {
    return this._httpClient.get<Translation>(`assets/i18n/${lang}.json`);
  }
}
