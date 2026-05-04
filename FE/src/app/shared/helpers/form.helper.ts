import {Injectable} from '@angular/core';
import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {PasswordStrengthModel} from '@shared/models/password-strength.model';

/**
 * Shared helper service providing reactive form utilities.
 * Includes input sanitization, custom validators, and password strength evaluation.
 */
@Injectable({providedIn: 'root'})
export class FormHelper {

  /**
   * Prevents the default action of an event, used to block space key input in form fields.
   * @param event - The keyboard space event to suppress.
   */
  public preventSpace(event: Event): void {
    event.preventDefault();
  }

  /**
   * Handles paste events by stripping all whitespace from the pasted text
   * before applying it to the specified form control.
   * @param event - The clipboard paste event.
   * @param controlName - The name of the form control to update.
   * @param form - The form group containing the control.
   */
  public preventSpaceOnPaste(event: ClipboardEvent, controlName: string, form: FormGroup): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const textWithoutSpaces = pastedText.replace(/\s/g, '');

    const control = form.get(controlName);
    if (control) {
      control.setValue(textWithoutSpaces);
    }
  }

  /**
   * Returns whether a form control should be displayed as invalid.
   * A control is considered invalid when it fails validation and has been touched or the form was submitted.
   * @param controlName - The name of the form control to check.
   * @param form - The form group containing the control.
   * @param isSubmitting - Whether the form submission has been attempted.
   * @returns `true` if the control should show an invalid state.
   */
  public isControlInvalid(controlName: string, form: FormGroup, isSubmitting: boolean): boolean {
    const control = form.get(controlName);
    return !!(control?.invalid && (control.touched || isSubmitting));
  }

  /**
   * Returns a validator that checks password strength.
   * A valid password must meet all the following criteria:
   * minimum 8 characters, at least one uppercase letter, one lowercase letter,
   * one numeric character, and one special character.
   * @returns A `ValidatorFn` that returns `{ passwordStrength: true }` on failure, or null on success.
   */
  public passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const passwordValid =
        this._hasMinLength(value, 8) &&
        this._hasUpperCase(value) &&
        this._hasLowerCase(value) &&
        this._hasNumeric(value) &&
        this._hasSpecialChar(value);

      return !passwordValid ? {passwordStrength: true} : null;
    };
  }

  /**
   * Returns a validator that checks whether `password` and `confirmPassword` match.
   * Sets `{ passwordMismatch: true }` on the `confirmPassword` control if they differ.
   * Skips validation if `confirmPassword` is empty.
   * @returns A `ValidatorFn` that returns `{ passwordMismatch: true }` on failure, or null on success.
   */
  public passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');

      if (!password || !confirmPassword) return null;
      if (confirmPassword.value === '') return null;

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({passwordMismatch: true});
        return {passwordMismatch: true};
      } else {
        const errors = confirmPassword.errors;
        if (errors) {
          delete errors['passwordMismatch'];
          confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
        return null;
      }
    };
  }

  /**
   * Returns a validator that checks whether a phone number contains a valid number of digits.
   * Strips all non-numeric characters before validation.
   * Considers a phone number valid if it is either empty or contains at least 12 digits.
   * @returns A `ValidatorFn` that returns `{ invalidPhone: true }` on failure, or null on success.
   */
  public phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length > 0 && cleaned.length < 12) {
        return {invalidPhone: true};
      }

      return null;
    };
  }

  /**
   * Evaluates the strength of a password against common criteria.
   * @param text - The password string to evaluate.
   * @param minLength - The minimum required character length.
   * @returns A {@link PasswordStrengthModel} with boolean flags for each criterion.
   */
  public getPasswordStrength(text: string, minLength: number): PasswordStrengthModel {
    return {
      hasMinLength: this._hasMinLength(text, minLength),
      hasUpperCase: this._hasUpperCase(text),
      hasLowerCase: this._hasLowerCase(text),
      hasNumeric: this._hasNumeric(text),
      hasSpecialChar: this._hasSpecialChar(text),
    };
  }

  /**
   * @returns Whether the text meets the minimum length requirement.
   */
  private _hasMinLength(text: string, length: number): boolean {
    return text.length >= length;
  }

  /**
   * @returns Whether the text contains at least one uppercase letter.
   */
  private _hasUpperCase(text: string): boolean {
    return /[A-Z]/.test(text);
  }

  /**
   * @returns Whether the text contains at least one lowercase letter.
   */
  private _hasLowerCase(text: string): boolean {
    return /[a-z]/.test(text);
  }

  /**
   * @returns Whether the text contains at least one numeric character.
   */
  private _hasNumeric(text: string): boolean {
    return /[0-9]/.test(text);
  }

  /**
   * @returns Whether the text contains at least one special character.
   */
  private _hasSpecialChar(text: string): boolean {
    return /[^A-Za-z0-9\s]/.test(text);
  }
}
