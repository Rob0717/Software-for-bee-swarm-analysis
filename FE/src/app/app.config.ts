import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import {provideTransloco, translocoConfig} from '@jsverse/transloco';
import {ConfirmationService, MessageService} from 'primeng/api';
import {providePrimeNG} from 'primeng/config';
import {PrimeNgI18nService} from '@app/core/i18n/primeng-i18n.service';
import {Interceptor} from '@app/core/interceptors/interceptor.service';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {TranslocoHttpLoader} from '@app/transloco.loader';
import {routes} from './app.routes';
import {environment} from '../../environment';
import {Preset} from '../mypreset';

/**
 * Factory function for the `APP_INITIALIZER` token.
 * Triggers user session loading before the application fully initializes,
 * ensuring the authenticated user state is available on first render.
 * @param _authFacade - The auth facade used to load the current user.
 * @returns A factory function that calls `loadUser()`.
 */
export function initUser(_authFacade: AuthFacade) {
  return () => _authFacade.loadUser();
}

/**
 * Root application configuration.
 * Registers global providers including routing, HTTP client, animations,
 * PrimeNG theme, Transloco translations, and application initializers.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes, withInMemoryScrolling({scrollPositionRestoration: 'top'})),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),

    /** PrimeNG theme configuration with custom preset and dark mode support. */
    providePrimeNG({
      theme: {
        preset: Preset,
        options: {
          darkModeSelector: '.my-app-dark'
        }
      }
    }),

    /** Transloco i18n configuration. */
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['en', 'cs'],
        defaultLang: 'cs',
        reRenderOnLangChange: true,
        prodMode: environment.production
      }),
      loader: TranslocoHttpLoader
    }),

    MessageService,
    ConfirmationService,

    /** Loads the authenticated user session before the app renders. */
    {provide: APP_INITIALIZER, multi: true, useFactory: initUser, deps: [AuthFacade]},

    /** Initializes PrimeNG i18n translations on app startup. */
    {provide: APP_INITIALIZER, multi: true, deps: [PrimeNgI18nService], useFactory: (s: PrimeNgI18nService) => () => s.init()},

    /** Registers the global HTTP interceptor for error handling. */
    {provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true}
  ]
};
