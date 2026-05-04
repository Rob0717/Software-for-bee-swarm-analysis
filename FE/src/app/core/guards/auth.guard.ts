import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {

  constructor(
    private _authFacade: AuthFacade,
    private _router: Router
  ) {}

  /**
   * Route guard that allows access only to authenticated users.
   *
   * Behavior:
   * - Checks current login status
   * - Redirects unauthenticated users to the login page
   * - Prevents route activation when authentication fails
   */
  public canActivate(): Observable<boolean> {
    return this._authFacade.loggedInStatus$()
      .pipe(
        // Extract authentication state from the response
        map(response => response.isLoggedIn),

        // Redirect unauthenticated users to the login page
        tap(isLoggedIn => {
          if (!isLoggedIn) {
            void this._router.navigate(['/auth/login']);
          }
        }),

        // Handle errors by redirecting to the login page and blocking route activation
        catchError(() => {
          this._authFacade.clearUserState();
          void this._router.navigate(['/auth/login']);
          return of(false);
        })
    );
  }
}
