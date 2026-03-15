import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {SelectOptionModel} from '@shared/models/select-option.model';

/**
 * Service for managing application language settings and notifications.
 *
 * Provides functionality to:
 * - Get available languages
 * - Change the current language
 * - Subscribe to language change events
 */
@Injectable({providedIn: 'root'})
export class LanguageService {

  /** Subject for emitting language change events */
  private _languageChange$ = new Subject<string>();

  /** Observable stream of language changes that components can subscribe to */
  public readonly languageChange$ = this._languageChange$.asObservable();

  /**
   * Returns the list of available languages in the application.
   * @returns Array of language objects with label (display name) and value (language code)
   */
  public getLanguages(): SelectOptionModel<string>[] {
    return [
      {label: 'Čeština', value: 'cs'},
      {label: 'English', value: 'en'}
    ];
  }

  /**
   * Changes the application language and notifies all subscribers.
   * @param lang - The language value to switch to
   */
  public changeLanguage(lang: string): void {
    this._languageChange$.next(lang);
  }
}
