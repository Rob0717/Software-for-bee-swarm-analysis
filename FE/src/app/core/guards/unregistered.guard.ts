import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';

@Injectable({providedIn: 'root'})
export class UnregisteredGuard implements CanActivate {

  constructor(
    private _authFacade: AuthFacade,
    private _router: Router
  ) {}

  /**
   * Route guard that allows access only to unauthenticated users.
   *
   * Behavior:
   * - If the user is logged in, redirect to the home page
   * - If the user is not logged in, allow route activation
   */
  public canActivate(): Observable<boolean> {
    return this._authFacade.loggedInStatus$()
      .pipe(
        // Extract authentication state from the response
        map(res => res.isLoggedIn),

        // Redirect authenticated users away from unauthenticated-only routes
        tap(isLoggedIn => {
          if (isLoggedIn) {
            void this._router.navigate(['/']);
          }
        }),

        // Allow route activation only when the user is not logged in
        map(isLoggedIn => !isLoggedIn),

        // In case of error, allow access (treat user as unauthenticated)
        catchError(() => {
          this._authFacade.clearUserState();
          return of(true);
        })
      );
  }
}
