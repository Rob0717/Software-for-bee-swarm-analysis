import {Injectable, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {
  BehaviorSubject,
  catchError, EMPTY,
  filter,
  firstValueFrom,
  map,
  Observable,
  of, Subject,
  switchMap, takeUntil,
  tap,
  withLatestFrom
} from 'rxjs';
import {LanguageService} from '@app/core/services/language.service';
import {AuthRepository} from '@app/pages/auth/persistent/repositories/auth.repository';
import {TypeCodeResponseDto} from '@shared/models/generated-dtos/type-code-response-dto';
import {UserLoggedInResponseDto} from '@shared/models/generated-dtos/user-logged-in-response-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';
import {UserVerifyAccountResponseDto} from '@shared/models/generated-dtos/user-verify-account-response-dto';
import {ValidateSetNewPasswordResponseDto} from '@shared/models/generated-dtos/validate-set-new-password-response-dto';

/**
 * Facade for authentication and user session management.
 *
 * Manages the authenticated user state with a BehaviorSubject with three possible states:
 * - `undefined` — initial state, user data are not loaded yet
 * - `null` — user is not authenticated
 * - `UserResponseDto` — user is authenticated
 */
@Injectable({providedIn: 'root'})
export class AuthFacade implements OnDestroy {

  /**
   * Internal state holder for the currently authenticated user.
   * `undefined` indicates the state has not been resolved yet.
   */
  private _userSubject$ = new BehaviorSubject<UserResponseDto | null | undefined>(undefined);

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _authRepository: AuthRepository,
    private _router: Router,
    private _languageService: LanguageService,
  ) {
    this._observeLanguageChanges();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Emits the currently authenticated user, or `null` if not authenticated.
   * Filters out the initial `undefined` state, so subscribers only receive
   * resolved values.
   * @returns Observable of the current user or null.
   */
  public user$(): Observable<UserResponseDto | null> {
    return this._userSubject$.asObservable().pipe(
      filter(user => user !== undefined),
      map(user => user as UserResponseDto | null)
    );
  }

  /**
   * Triggers a load of the authenticated user from the backend.
   */
  public loadUser(): void {
    this._loadUser();
  }

  /**
   * Returns the current login status from the backend.
   * If the user is not logged in, clears the local user state as a side effect.
   * @returns Observable of the login status response.
   */
  public loggedInStatus$(): Observable<UserLoggedInResponseDto> {
    return this._authRepository.isLoggedIn$()
      .pipe(
        tap(response => {
          if (!response.isLoggedIn) {
            this._userSubject$.next(null);
          }
        })
      );
  }

  /**
   * Clears the local user state without calling the backend.
   * Used by the HTTP interceptor when a 401 or 403 response is received.
   */
  public clearUserState(): void {
    this._userSubject$.next(null);
  }

  /**
   * Authenticates the user with the provided credentials.
   * Navigates to the home page on success.
   * @param email - The user's email address.
   * @param password - The user's password.
   * @param language - The preferred language code for the session.
   */
  public async login(email: string, password: string, language: string): Promise<void> {
    await firstValueFrom(this._authRepository.login$({email, password, language}));
  }

  /**
   * Registers a new user account.
   * @param name - First name.
   * @param surname - Last name.
   * @param email - Email address.
   * @param password - Account password.
   * @param language - Preferred language code.
   * @param latitude - User's location latitude.
   * @param longitude - User's location longitude.
   * @param phoneNumber - Optional phone number.
   * @param address - Optional address.
   * @returns A promise resolving to the registration response.
   */
  public async register(name: string, surname: string, email: string, password: string, language: string, latitude: number, longitude: number, phoneNumber?: string, address?: string): Promise<UserResponseDto> {
    return await firstValueFrom(this._authRepository.register$({name, surname, email, password, language, latitude, longitude, phoneNumber, address}));
  }

  /**
   * Confirms a user's account using a verification token.
   * @param token - The account confirmation token.
   * @returns A promise resolving to the confirmation response.
   */
  public async confirmAccount(token: string): Promise<UserVerifyAccountResponseDto> {
    return await firstValueFrom(this._authRepository.confirmAccount$(token));
  }

  /**
   * Initiates the forgotten password flow by sending a reset email.
   * @param email - The email address associated with the account.
   * @param language - The preferred language for the reset email.
   * @returns A promise resolving when the request completes.
   */
  public async forgottenPassword(email: string, language: string): Promise<TypeCodeResponseDto> {
    return await firstValueFrom(this._authRepository.forgottenPassword$(email, language));
  }

  /**
   * Sets a new password using a password reset token.
   * @param token - The password reset token.
   * @param password - The new password to set.
   * @returns A promise resolving to the update response.
   */
  public async setNewPassword(token: string, password: string): Promise<TypeCodeResponseDto> {
    return await firstValueFrom(this._authRepository.setNewPassword$(token, password));
  }

  /**
   * Validates whether a password reset token is still valid.
   * @param token - The token to validate.
   * @returns A promise resolving to the validation response.
   */
  public async validateSetNewPasswordToken(token: string): Promise<ValidateSetNewPasswordResponseDto> {
    return await firstValueFrom(this._authRepository.validateSetNewPasswordToken$(token));
  }

  /**
   * Logs out the current user by calling the backend logout endpoint,
   * clearing local user state, and redirecting to the login page.
   */
  public async logout(): Promise<void> {
    await firstValueFrom(this._authRepository.logout$());
    this._userSubject$.next(null);
    void this._router.navigate(['/auth/login']);
  }

  /**
   * Subscribes to language change events and notifies the backend
   * whenever the authenticated user changes their preferred language.
   * Skips the update if no user is currently authenticated.
   */
  private _observeLanguageChanges(): void {
    this._languageService.languageChange$.pipe(
      withLatestFrom(this.user$()),
      switchMap(([language, user]) => {
        if (!user) return EMPTY;
        return this._authRepository.changeUserLanguage$({language});
      }),
      takeUntil(this._destroy$)
    ).subscribe();
  }

  /**
   * Fetches the authenticated user's data from the backend and updates the user state.
   * First checks login status to avoid unnecessary calls — if not logged in, emits null.
   * Any errors during the process result in null being emitted.
   */
  private _loadUser(): void {
    this._authRepository.isLoggedIn$().pipe(
      switchMap(status => {
        if (!status.isLoggedIn) {
          return of(null);
        }

        return this._authRepository.getUserInfo$().pipe(
          catchError(() => of(null))
        );
      }),
      catchError(() => {
        return of(null);
      })
    )
      .pipe(takeUntil(this._destroy$))
      .subscribe(user => {
      this._userSubject$.next(user);
    });
  }
}
