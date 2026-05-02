import {Component, OnDestroy} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {Divider} from 'primeng/divider';
import {FloatLabel} from 'primeng/floatlabel';
import {Image} from 'primeng/image';
import {Message} from 'primeng/message';
import {Password} from 'primeng/password';
import {Subject, takeUntil} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {FormHelper} from '@shared/helpers/form.helper';
import {AlertService} from '@shared/services/alert.service';

/**
 * Component for the set new password page.
 * Validates the password reset token from the URL before rendering the form.
 * Provides real-time password strength feedback and submits the new password on confirmation.
 */
@Component({
  standalone: true,
  selector: 'app-set-new-password',
  imports: [
    Button,
    Card,
    FloatLabel,
    FormsModule,
    Image,
    Password,
    ReactiveFormsModule,
    TranslocoPipe,
    Divider,
    Image,
    RouterLink,
    Message,
    PrimeTemplate
  ],
  templateUrl: './set-new-password.component.html',
  styleUrl: './set-new-password.component.scss'
})
export class SetNewPasswordComponent implements OnDestroy {

  /** The reactive form group for the set new password form. */
  public setNewPasswordForm!: FormGroup;

  /** Whether the form submission is currently in progress. */
  public isSubmitting: boolean = false;

  /** Whether the password meets the minimum length requirement. */
  public hasMinLength: boolean = false;

  /** Whether the password contains at least one uppercase letter. */
  public hasUpperCase: boolean = false;

  /** Whether the password contains at least one lowercase letter. */
  public hasLowerCase: boolean = false;

  /** Whether the password contains at least one numeric character. */
  public hasNumeric: boolean = false;

  /** Whether the password contains at least one special character. */
  public hasSpecialChar: boolean = false;

  /** Whether the password reset token has been validated as still valid on the backend. */
  public isTokenValid: boolean = false;

  /** Whether the token validation request is still in progress. */
  public isCheckingToken: boolean = true;

  /** The password reset token extracted from the URL query parameters. */
  private _token: string | null = null;

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _formBuilder: FormBuilder,
    private _activatedRoute: ActivatedRoute,
    private _authFacade: AuthFacade,
    private _alertService: AlertService,
    private _translationService: TranslocoService,
    protected _formHelper: FormHelper,
    private _router: Router
  ) {
    this._checkToken();
    this._initializeForm();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Handles set new password form submission.
   * Submits the new password along with the reset token if both the form and token are valid.
   * Navigates to the login page and shows a success alert on success.
   * Shows an error alert and resets the form if the token is missing or invalid.
   */
  public submitForm(): void {
    this.isSubmitting = true;
    const password = this.setNewPasswordForm.get<string>('password')?.value;

    if (this.setNewPasswordForm.valid && this._token) {
      this._authFacade.setNewPassword(this._token, password)
        .then(result => {
          const summary = `auth.set-new-password.success.type.${result.type}`;
          const detail = `auth.set-new-password.success.code.${result.code}`;

          this._router.navigate(['/auth/login']).then(() => {
            this._alertService.showAlert({
              severity: 'success',
              summary: this._translationService.translate(summary),
              detail: this._translationService.translate(detail)
            });
          });
        })
        .catch(error => {
          this._alertService.handleErrorAlert(error);
        })
        .finally(() => {
          this.isSubmitting = false;
          this.setNewPasswordForm.reset();
        });
    } else {
      this._alertService.handleErrorAlert({
        error: {
          type: 'INVALID_OR_EXPIRED_TOKEN',
          code: 'INVALID_OR_EXPIRED_TOKEN'
        }
      });
      this.isSubmitting = false;
      this.setNewPasswordForm.reset();
    }
  }

  /**
   * Initializes the set new password form with validation rules.
   * Subscribes to password value changes to update real-time strength indicator flags.
   */
  private _initializeForm(): void {
    this.setNewPasswordForm = this._formBuilder.group({
      password: ['', [Validators.required, this._formHelper.passwordStrengthValidator(), Validators.maxLength(60)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this._formHelper.passwordMatchValidator()
    });

    this.setNewPasswordForm.get('password')?.valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(password => {
        const s = this._formHelper.getPasswordStrength(password || '', 8);
        this.hasMinLength = s.hasMinLength;
        this.hasUpperCase = s.hasUpperCase;
        this.hasLowerCase = s.hasLowerCase;
        this.hasNumeric = s.hasNumeric;
        this.hasSpecialChar = s.hasSpecialChar;
      });
  }

  /**
   * Reads the password reset token from the URL query parameters and validates it against the backend.
   * Sets {@link isTokenValid} based on the validation result and clears {@link isCheckingToken} when done.
   * If no token is present in the URL, skips validation and clears the loading state immediately.
   */
  private _checkToken(): void {
    this._activatedRoute.queryParamMap
      .pipe(takeUntil(this._destroy$))
      .subscribe(params => {
        this._token = params.get('token');
        if (this._token) {
          this._authFacade.validateSetNewPasswordToken(this._token)
            .then(result => {
              this.isTokenValid = result.valid;
              this.isCheckingToken = false;
            })
            .catch(() => this._router.navigate(['/']));
        } else {
          this.isCheckingToken = false;
        }
      });
  }
}
