import {Component, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {Divider} from 'primeng/divider';
import {FloatLabel} from 'primeng/floatlabel';
import {Image} from 'primeng/image';
import {InputMask} from 'primeng/inputmask';
import {InputText} from 'primeng/inputtext';
import {Message} from 'primeng/message';
import {Password} from 'primeng/password';
import {Toast} from 'primeng/toast';
import {Subject, takeUntil} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {MapComponent} from '@app/shared/components/presentation/generic-map/map.component';
import {FormHelper} from '@shared/helpers/form.helper';
import {LocationDataModel} from '@shared/models/location-data.model';
import {AlertService} from '@shared/services/alert.service';

/**
 * Component for the user registration page.
 * Renders a registration form with location selection with a map
 * and real-time password strength validation feedback.
 */
@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    Button,
    Card,
    FloatLabel,
    FormsModule,
    Image,
    InputText,
    InputMask,
    Message,
    Password,
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    Divider,
    MapComponent,
    Toast,
    PrimeTemplate
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnDestroy {

  /** The reactive form group for the registration form. */
  public registerForm!: FormGroup;

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

  /** The location selected by the user on the map, used as their residence. */
  public selectedLocation: LocationDataModel = {latitude: -1, longitude: -1};

  /** Subject that emits to trigger a map reset after successful registration. */
  public clearMap = new Subject<void>();

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _formBuilder: FormBuilder,
    private _authFacade: AuthFacade,
    private _alertService: AlertService,
    private _translationService: TranslocoService,
    protected _formHelper: FormHelper
  ) {
    this._initializeForm();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Handles a location selection event from the map component.
   * Updates the selected location and patches the form with the chosen coordinates.
   * @param location - The location data selected on the map.
   */
  public onResidenceSelected(location: LocationDataModel): void {
    this.selectedLocation = location;
    this.registerForm.patchValue({
      latitude: location?.latitude,
      longitude: location?.longitude
    });
  }

  /**
   * Handles registration form submission.
   * Trims all string field values, validates the form, and submits the registration request.
   * Displays success and info alerts on success, or an error alert on failure.
   * Resets the password fields on failure and clears the entire form and map on success.
   */
  public submitForm(): void {
    this.isSubmitting = true;

    ['name', 'surname', 'email', 'phone', 'password', 'confirmPassword'].forEach(key => {
      const control = this.registerForm.get(key);
      if (control && typeof control.value === 'string') {
        control.setValue(control.value.trim());
      }
    });

    if (this.registerForm.valid) {
      const name = this.registerForm.get('name')?.value;
      const surname = this.registerForm.get('surname')?.value;
      const email = this.registerForm.get('email')?.value;
      const password = this.registerForm.get('password')?.value;
      const phoneNumber = this.registerForm.get('phone')?.value;

      this._authFacade.register(
        name, surname, email, password,
        this._translationService.getActiveLang(),
        this.selectedLocation.latitude,
        this.selectedLocation.longitude,
        phoneNumber,
        this.selectedLocation?.address
      )
        .then(() => {
          const successSummary = this._translationService.translate('auth.register.success.summary');
          const successDetail = this._translationService.translate('auth.register.success.detail');
          const infoSummary = this._translationService.translate('auth.register.info.summary');
          const infoDetail = this._translationService.translate('auth.register.info.detail');

          this._alertService.showAlert({severity: 'success', summary: successSummary, detail: successDetail});
          this._alertService.showAlert({severity: 'info', sticky: true, key: 'bc', summary: infoSummary, detail: infoDetail});
          this.registerForm.reset();
          this.clearMap.next();
          this.selectedLocation = {latitude: -1, longitude: -1};
        })
        .catch(error => {
          this._alertService.handleErrorAlert(error);
          this.registerForm.get('password')?.reset();
          this.registerForm.get('confirmPassword')?.reset();
        })
        .finally(() => this.isSubmitting = false);
    } else {
      this.isSubmitting = false;
    }
  }

  /**
   * Initializes the registration form with field validators.
   * Subscribes to password value changes to update real-time strength indicator flags.
   */
  private _initializeForm(): void {
    this.registerForm = this._formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(30)]],
      surname: ['', [Validators.required, Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      phone: ['', [this._formHelper.phoneValidator()]],
      password: ['', [Validators.required, this._formHelper.passwordStrengthValidator(), Validators.maxLength(60)]],
      confirmPassword: ['', Validators.required],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required]
    }, {
      validators: this._formHelper.passwordMatchValidator()
    });

    this.registerForm.get('password')?.valueChanges
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
}
