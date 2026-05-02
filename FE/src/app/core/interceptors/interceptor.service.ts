import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {catchError, Observable, throwError} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';

/**
 * HTTP interceptor that handles authentication and authorization errors globally.
 *
 * This interceptor:
 * - Ensures all HTTP requests include credentials (cookies)
 * - Handles 401 (Unauthorized) errors by clearing user state and redirecting to login page
 * - Handles 403 (Forbidden) errors by redirecting to login page (banned users) or forbidden page
 */
@Injectable()
export class Interceptor implements HttpInterceptor {

  /** Prevents multiple simultaneous redirects caused by concurrent HTTP errors. */
  private _isRedirecting = false;

  constructor(
    private _authFacade: AuthFacade,
    private _router: Router
  ) {}

  /**
   * Intercepts outgoing HTTP requests and handles authentication/authorization errors.
   * @param req - The outgoing HTTP request.
   * @param next - The next handler in the interceptor chain.
   * @returns Observable of the HTTP event stream.
   */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    /** Clone request to include credentials (cookies) for authentication. */
    const credentialsReq = req.clone({
      withCredentials: true
    });

    return next.handle(credentialsReq)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          /** Handle unauthorized access - user session expired or invalid. */
          if (error.status === 401) {
            this._handleUnauthenticated();
          }

          /** Handle forbidden access - user lacks permissions or is banned. */
          if (error.status === 403) {
            const isBanned = error.error?.type === 'FORBIDDEN_BANNED_ACCESS';

            if (isBanned) {
              this._handleUnauthenticated();
            } else {
              this._handleForbidden();
            }
          }

          return throwError(() => {
            this._authFacade.clearUserState();
            return error;
          });
        })
      );
  }

  /**
   * Clears the user state and redirects to the login page.
   * Guarded by {@link _isRedirecting} to prevent duplicate redirects.
   */
  private _handleUnauthenticated(): void {
    if (this._isRedirecting) return;
    this._isRedirecting = true;
    this._authFacade.clearUserState();
    void this._router.navigate(['/auth/login']).finally(() => {
      this._isRedirecting = false;
    });
  }

  /**
   * Redirects to the forbidden page if not already there.
   * Guarded by {@link _isRedirecting} to prevent duplicate redirects.
   */
  private _handleForbidden(): void {
    if (this._isRedirecting) return;
    this._isRedirecting = true;
    void this._router.navigate(['/forbidden']).finally(() => {
      this._isRedirecting = false;
    });
  }
}
