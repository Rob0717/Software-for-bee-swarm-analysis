import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ChangeUserLanguageRequestDto} from '@shared/models/generated-dtos/change-user-language-request-dto';
import {SetNewPasswordRequestDto} from '@shared/models/generated-dtos/set-new-password-request-dto';
import {TypeCodeResponseDto} from '@shared/models/generated-dtos/type-code-response-dto';
import {UserLoggedInResponseDto} from '@shared/models/generated-dtos/user-logged-in-response-dto';
import {UserLoginRequestDto} from '@shared/models/generated-dtos/user-login-request-dto';
import {UserRegisterRequestDto} from '@shared/models/generated-dtos/user-register-request-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';
import {UserVerifyAccountResponseDto} from '@shared/models/generated-dtos/user-verify-account-response-dto';
import {ValidateSetNewPasswordRequestDto} from '@shared/models/generated-dtos/validate-set-new-password-request-dto';
import {ValidateSetNewPasswordResponseDto} from '@shared/models/generated-dtos/validate-set-new-password-response-dto';
import {environment} from '../../../../../../environment';

/**
 * Repository responsible for authentication-related HTTP communication.
 */
@Injectable({providedIn: 'root'})
export class AuthRepository {

  constructor(
    private _httpClient: HttpClient
  ) {}

  /**
   * Authenticates the user with the provided credentials.
   * The backend sets an HTTP-only cookie on success.
   * @param dto - The login request payload containing email, password, and language.
   * @returns An observable resolving to the login response.
   */
  public login$(dto: UserLoginRequestDto): Observable<void> {
    return this._httpClient.post<void>(
      `${environment.apiUrl}/auth/login`,
      dto
    );
  }

  /**
   * Logs out the currently authenticated user.
   * The backend invalidates the session and clears the auth cookie.
   * @returns An observable that completes when logout is successful.
   */
  public logout$(): Observable<void> {
    return this._httpClient.post<void>(
      `${environment.apiUrl}/auth/logout`,
      {}
    );
  }

  /**
   * Registers a new user account.
   * @param dto - The registration request payload.
   * @returns An observable resolving to the newly created user data.
   */
  public register$(dto: UserRegisterRequestDto): Observable<UserResponseDto> {
    return this._httpClient.post<UserResponseDto>(
      `${environment.apiUrl}/auth/register`,
      dto
    );
  }

  /**
   * Checks whether the current user has an active session on the backend.
   * @returns An observable resolving to the login status response.
   */
  public isLoggedIn$(): Observable<UserLoggedInResponseDto> {
    return this._httpClient.get<UserLoggedInResponseDto>(
      `${environment.apiUrl}/auth/logged-in-status`
    );
  }

  /**
   * Retrieves the profile data of the currently authenticated user.
   * @returns An observable resolving to the user response data.
   */
  public getUserInfo$(): Observable<UserResponseDto> {
    return this._httpClient.get<UserResponseDto>(
      `${environment.apiUrl}/users/user`
    );
  }

  /**
   * Confirms a user's account using an email verification token.
   * @param token - The verification token from the confirmation email.
   * @returns An observable resolving to the account verification response.
   */
  public confirmAccount$(token: string): Observable<UserVerifyAccountResponseDto> {
    return this._httpClient.get<UserVerifyAccountResponseDto>(
      `${environment.apiUrl}/auth/confirm-account`,
      {
        params: {token}
      }
    );
  }

  /**
   * Initiates the forgotten password flow by requesting a reset email.
   * @param email - The email address associated with the account.
   * @param language - The preferred language for the reset email.
   * @returns An observable resolving to a response indicating the result.
   */
  public forgottenPassword$(email: string, language: string): Observable<TypeCodeResponseDto> {
    return this._httpClient.get<TypeCodeResponseDto>(
      `${environment.apiUrl}/auth/forgotten-password`,
      {
        params: {email, lang: language}
      }
    );
  }

  /**
   * Sets a new password using a valid password reset token.
   * @param token - The password reset token from the reset email.
   * @param password - The new password to set.
   * @returns An observable resolving to a response indicating the result.
   */
  public setNewPassword$(token: string, password: string): Observable<TypeCodeResponseDto> {
    const dto: SetNewPasswordRequestDto = {
      token: token,
      newPassword: password
    };
    return this._httpClient.post<TypeCodeResponseDto>(
      `${environment.apiUrl}/auth/set-new-password`,
      dto
    );
  }

  /**
   * Validates whether a password reset token is still valid before allowing the user to set a new password.
   * @param token - The token to validate.
   * @returns An observable resolving to the validation response.
   */
  public validateSetNewPasswordToken$(token: string): Observable<ValidateSetNewPasswordResponseDto> {
    const dto: ValidateSetNewPasswordRequestDto = {
      token: token
    };
    return this._httpClient.post<ValidateSetNewPasswordResponseDto>(
      `${environment.apiUrl}/auth/validate-set-password-token`,
      dto
    );
  }

  /**
   * Updates the preferred language for the currently authenticated user.
   * @param dto - The dto with new language code to set.
   * @returns An observable that completes when the update is successful.
   */
  public changeUserLanguage$(dto: ChangeUserLanguageRequestDto): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}/auth/change-user-language`,
      dto
    );
  }
}
