import {Component} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {FloatLabel} from 'primeng/floatlabel';
import {Image} from 'primeng/image';
import {InputText} from 'primeng/inputtext';
import {Message} from 'primeng/message';
import {Password} from 'primeng/password';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {FormHelper} from '@shared/helpers/form.helper';
import {AlertService} from '@shared/services/alert.service';

/**
 * Component for the user login page.
 * Renders a login form and handles authentication with {@link AuthFacade}.
 */
@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    FormsModule,
    Card,
    ReactiveFormsModule,
    FloatLabel,
    InputText,
    Password,
    Image,
    Button,
    RouterLink,
    Message,
    TranslocoPipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  /** The reactive form group for the login form. */
  public loginForm: FormGroup;

  /** Whether the form submission is currently in progress. */
  public isSubmitting: boolean = false;

  constructor(
    private _formBuilder: FormBuilder,
    private _alertService: AlertService,
    private _authFacade: AuthFacade,
    private _translationService: TranslocoService,
    private _router: Router,
    protected _formHelper: FormHelper
  ) {
    this.loginForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  /**
   * Handles login form submission.
   * Authenticates the user with the provided credentials and navigates to the home page on success.
   * Displays a success alert on login, or an error alert on failure.
   * Resets the password field if authentication fails.
   */
  public submitForm(): void {
    this.isSubmitting = true;
    if (this.loginForm.valid) {
      this._authFacade.login(
        this.loginForm.get('email')?.value,
        this.loginForm.get('password')?.value,
        this._translationService.getActiveLang())
        .then(() => {
          this._alertService.showAlert({
            summary: this._translationService.translate('auth.login.success.summary'),
            detail: this._translationService.translate('auth.login.success.detail'),
            severity: 'success',
          });
        })
        .then(() => this._router.navigate(['/']))
        .catch(error => {
          this._alertService.handleErrorAlert(error);
          this.loginForm.get('password')?.reset();
        })
        .finally(() => this.isSubmitting = false);
    }
  }
}
