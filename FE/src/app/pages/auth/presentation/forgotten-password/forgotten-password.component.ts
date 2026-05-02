import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {FloatLabel} from 'primeng/floatlabel';
import {Image} from 'primeng/image';
import {InputText} from 'primeng/inputtext';
import {Message} from 'primeng/message';
import {asyncScheduler} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {FormHelper} from '@shared/helpers/form.helper';
import {AlertService} from '@shared/services/alert.service';

/**
 * Component for the forgotten password flow.
 * Renders a form where the user can request a password reset email.
 */
@Component({
  standalone: true,
  selector: 'app-forgotten-password',
  imports: [
    Card,
    Image,
    TranslocoPipe,
    InputText,
    FloatLabel,
    Message,
    ReactiveFormsModule,
    Button
  ],
  templateUrl: './forgotten-password.component.html',
  styleUrl: './forgotten-password.component.scss'
})
export class ForgottenPasswordComponent {

  /** The reactive form group for the forgotten password request. */
  public forgottenPasswordForm: FormGroup;

  /** Whether the form submission is currently in progress. */
  public isSubmitting: boolean = false;

  constructor(
    private _formBuilder: FormBuilder,
    private _alertService: AlertService,
    private _authFacade: AuthFacade,
    private _translationService: TranslocoService,
    protected _formHelper: FormHelper
  ) {
    this.forgottenPasswordForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Handles forgotten password form submission.
   * Sends a password reset request for the provided email address.
   * Displays a translated info alert on success, or an error alert on failure.
   * On failure, the error is shown with a 2-second delay to avoid send button spamming.
   */
  public submitForm(): void {
    this.isSubmitting = true;

    if (this.forgottenPasswordForm.valid) {
      this._authFacade.forgottenPassword(this.forgottenPasswordForm.get('email')?.value, this._translationService.getActiveLang())
        .then(result => {
          this._alertService.showAlert({
            severity: 'info',
            summary: this._translationService.translate(`auth.forgotten-password.info.type.${result.type}`),
            detail: this._translationService.translate(`auth.forgotten-password.info.code.${result.code}`),
            sticky: true
          });
          this.forgottenPasswordForm.reset();
          this.isSubmitting = false;
        })
        .catch(error => {
          asyncScheduler.schedule(() => {
            this._alertService.handleErrorAlert(error);
            this.isSubmitting = false;
          }, 2000);
        });
    }
  }
}
