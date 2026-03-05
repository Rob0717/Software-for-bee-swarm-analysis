import {AsyncPipe} from '@angular/common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {TranslocoService} from '@jsverse/transloco';
import {MenuItem, PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Image} from 'primeng/image';
import {Menubar} from 'primeng/menubar';
import {Select} from 'primeng/select';
import {combineLatest, map, Observable, Subject, takeUntil} from 'rxjs';
import {MenuService} from '@app/components/menu/services/menu.service';
import {LanguageService} from '@app/core/services/language.service';
import {LanguageOptionModel} from '@shared/models/language-option.model';
import {NavItemModel} from '@shared/models/nav-item.model';

/**
 * Navigation bar component rendered at the top of the application.
 * Provides the main navigation menu, language selection, and light/dark mode toggle.
 * Menu item labels are reactively retranslated whenever the active language changes.
 */
@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [
    Menubar,
    Button,
    Image,
    RouterLink,
    Select,
    FormsModule,
    AsyncPipe,
    PrimeTemplate
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, OnDestroy {

  /**
   * Stream of translated PrimeNG menu items.
   * Automatically re-emits when the menu structure or active language changes.
   */
  protected items$!: Observable<MenuItem[]>;

  /** The language code currently selected in the language dropdown. */
  public selectedLanguage!: string;

  /** Available language options filled from {@link LanguageService}. */
  public languages: LanguageOptionModel[] = [];

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _translationService: TranslocoService,
    private _languageService: LanguageService,
    private _menuService: MenuService
  ) {}

  ngOnInit(): void {
    this.selectedLanguage = localStorage.getItem('lang') ?? 'cs';
    this.languages = this._languageService.getLanguages();

    /**
     * Combines the menu item stream with the translation change stream so that
     * menu labels are retranslated automatically whenever the active language changes.
     */
    this.items$ = combineLatest([
      this._menuService.getMenuItems$(),
      this._translationService.selectTranslation()
    ]).pipe(
      map(([items]) => this._translateMenu(items))
    );
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Toggles the application theme between light and dark mode.
   * The selected mode is persisted in localStorage and applied
   * with a CSS class on the root HTML element.
   */
  public toggleLightOrDarkMode(): void {
    const element = document.querySelector('html');
    const current = localStorage.getItem('darkMode');
    const isDark = current === 'true';

    localStorage.setItem('darkMode', (!isDark).toString());
    element?.classList.toggle('my-app-dark', !isDark);
  }

  /**
   * Handles a language change triggered by the user with the language dropdown.
   * Loads the selected languages translations, sets it as the active language,
   * updates the HTML lang attribute, and notifies {@link LanguageService}.
   * @param language - The language code selected by the user.
   */
  public onLanguageChange(language: string): void {
    this.selectedLanguage = language;
    localStorage.setItem('lang', language);

    this._translationService.load(language)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this._translationService.setActiveLang(language);
          const element = document.querySelector('html');
          element?.setAttribute('lang', language);
          this._languageService.changeLanguage(language);
        }
      });
  }

  /**
   * Translates all navigation items recursively into PrimeNG MenuItem objects.
   * @param items - The raw navigation item definitions to translate.
   * @returns An array of translated PrimeNG menu items.
   */
  private _translateMenu(items: NavItemModel[]): MenuItem[] {
    return items.map(item => this._mapItem(item));
  }

  /**
   * Maps a single navigation item to a PrimeNG MenuItem,
   * resolving its translation key and recursively mapping any child items.
   * @param item - The navigation item to map.
   * @returns The corresponding PrimeNG MenuItem.
   */
  private _mapItem(item: NavItemModel): MenuItem {
    return {
      ...item,
      label: item.labelKey ? this._translationService.translate(item.labelKey) : item.label,
      items: item.items?.map(child => this._mapItem(child))
    };
  }
}
