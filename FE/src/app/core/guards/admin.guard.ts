import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {map, catchError, of, Observable, switchMap} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {UserRoleEnum} from '@shared/enums/user-role.enum';

@Injectable({providedIn: 'root'})
export class AdminGuard implements CanActivate {

  constructor(
    private _authFacade: AuthFacade,
    private _router: Router
  ) {}

  /**
   * Route guard that allows access only to users with ADMIN role.
   *
   * Behavior:
   * - Gets user information from facade
   * - Grants access if the user is an admin
   * - Redirects to /forbidden otherwise
   */
  public canActivate(): Observable<boolean> {
    return this._authFacade.loggedInStatus$().pipe(
      switchMap(response => {
        if (!response.isLoggedIn) {
          void this._router.navigate(['/forbidden']);
          return of(false);
        }

        return this._authFacade.user$().pipe(
          map(user => {
            const canAccess = user?.role === UserRoleEnum.ADMIN;

            if (!canAccess) {
              void this._router.navigate(['/forbidden']);
            }

            return canAccess;
          }),
          catchError(() => {
            void this._router.navigate(['/forbidden']);
            return of(false);
          })
        );
      }),
      catchError(() => {
        this._authFacade.clearUserState();
        void this._router.navigate(['/forbidden']);
        return of(false);
      })
    );
  }
}
