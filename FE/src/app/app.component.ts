import {Component, OnDestroy} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {TranslocoService} from '@jsverse/transloco';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {Toast} from 'primeng/toast';
import {filter, map, merge, Subject, switchMap, takeUntil} from 'rxjs';
import {MenuComponent} from '@app/components/menu/presentation/menu.component';

/**
 * Root application component.
 * Handles global initialization on startup including language, theme, and dynamic page title management.
 */
@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MenuComponent,
    ConfirmDialogModule,
    Toast
  ],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnDestroy {

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _translationService: TranslocoService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _title: Title
  ) {
    this._setLanguage();
    this._setBackground();
    this._listenToRouteAndLanguageChanges();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Applies the persisted dark/light mode preference from localStorage
   * by toggling the `my-app-dark` CSS class on the root HTML element.
   */
  private _setBackground(): void {
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.querySelector('html')?.classList.toggle('my-app-dark', isDark);
  }

  /**
   * Restores the persisted language preference from localStorage,
   * defaulting to cs if none is set.
   * Sets the active Transloco language and updates the HTML `lang` attribute.
   */
  private _setLanguage(): void {
    const language = localStorage.getItem('lang') ?? 'cs';
    if (!localStorage.getItem('lang')) {
      localStorage.setItem('lang', 'cs');
    }

    this._translationService.setActiveLang(language);
    document.querySelector('html')?.setAttribute('lang', language);
  }

  /**
   * Subscribes to both route navigation events and language change events.
   * On each change, resolves the `titleKey` from the deepest active route's data,
   * translates it, and sets it as the browser page title.
   * Falls back to `'home.hero.title'` if no `titleKey` is defined on the route.
   */
  private _listenToRouteAndLanguageChanges(): void {
    const nav$ = this._router.events.pipe(filter(e => e instanceof NavigationEnd));
    const lang$ = this._translationService.langChanges$;

    merge(nav$, lang$)
      .pipe(
        map(() => {
          let route = this._activatedRoute;
          while (route.firstChild) route = route.firstChild;
          return route.snapshot.data['titleKey'] ?? 'home.hero.title';
        }),
        switchMap(key => this._translationService.selectTranslate(key)),
        takeUntil(this._destroy$)
      )
      .subscribe(title => this._title.setTitle(title));
  }
}
