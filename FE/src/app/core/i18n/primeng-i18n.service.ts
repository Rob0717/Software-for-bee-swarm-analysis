import {Injectable, OnDestroy} from '@angular/core';
import {TranslocoService} from '@jsverse/transloco';
import {PrimeNG} from 'primeng/config';
import {firstValueFrom, Subject, takeUntil} from 'rxjs';

/**
 * Service responsible for overriding internal PrimeNG translations
 * using application translations provided by Transloco.
 */
@Injectable({providedIn: 'root'})
export class PrimeNgI18nService implements OnDestroy {

  private readonly PRIMENG_TRANSLATION_KEY = 'primeng';

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _primeng: PrimeNG,
    private _translationService: TranslocoService
  ) {}

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Initializes PrimeNG translations.
   *
   * Behavior:
   * - Applies translations for the currently active language
   * - Reacts to future language changes and updates PrimeNG translations
   */
  async init(): Promise<void> {
    // Apply translations immediately for the currently active language
    await this.apply(this._translationService.getActiveLang());

    // React to translation availability and language changes
    this._translationService.selectTranslation()
      .pipe(takeUntil(this._destroy$))
      .subscribe(async () => {
        await this.apply(this._translationService.getActiveLang());
      });
  }

  /**
   * Loads PrimeNG-specific translation object from Transloco
   * and applies it to PrimeNG configuration.
   */
  private async apply(lang: string): Promise<void> {
    const translations = await firstValueFrom(
      this._translationService.selectTranslateObject(this.PRIMENG_TRANSLATION_KEY, {}, lang)
    );

    this._primeng.setTranslation(translations);
  }
}
