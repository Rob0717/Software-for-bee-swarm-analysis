import {Injectable} from '@angular/core';
import {TranslocoService} from '@jsverse/transloco';
import {Confirmation, ConfirmationService, MessageService, ToastMessageOptions} from 'primeng/api';
import {HandleErrorAlertModel} from '@shared/models/handle-error-alert.model';

/**
 * Shared service for displaying toast alerts and confirmation dialogs.
 * Centralizes error handling by extracting type and code from error responses
 * and mapping them to translated alert messages.
 */
@Injectable({providedIn: 'root'})
export class AlertService {

  constructor(
    private _messageService: MessageService,
    private _translationService: TranslocoService,
    private _confirmationService: ConfirmationService
  ) {}

  /**
   * Displays a PrimeNG confirmation dialog with the provided configuration.
   * @param confirm - The confirmation options including message, header, and accept/reject callbacks.
   */
  public confirmAlert(confirm: Confirmation): void {
    this._confirmationService.confirm(confirm);
  }

  /**
   * Displays a toast alert message.
   * Uses `Promise.resolve()` to defer the call outside the current change detection cycle,
   * preventing ExpressionChangedAfterItHasBeenCheckedError in some contexts.
   * @param alert - The toast message options including severity, summary, and detail.
   */
  public showAlert(alert: ToastMessageOptions): void {
    if (alert) {
      Promise.resolve().then(() => this._messageService.add(alert));
    }
  }

  /**
   * Extracts the error type and code from an error response and displays a translated toast alert.
   * Shows a warning severity for unverified account errors, and error severity for all others.
   * Falls back to `'UNKNOWN'` for both type and code if they are missing from the response.
   * @param error - The error response object to handle.
   */
  public handleErrorAlert(error: HandleErrorAlertModel): void {
    const errorType = this.getErrorType(error);
    const errorCode = this.getErrorCode(error);
    const severity = errorCode === 'ACCOUNT_NOT_VERIFIED' ? 'warn' : 'error';

    this.showAlert({
      severity,
      summary: this._translationService.translate(`error.type.${errorType}`),
      detail: this._translationService.translate(`error.code.${errorCode}`),
      life: 7000
    });
  }

  /**
   * Extracts the error type from an error response object.
   * @param error - The error response object.
   * @returns The error type string, or `'UNKNOWN'` if not present.
   */
  public getErrorType(error: HandleErrorAlertModel): string {
    return error?.error?.type ?? 'UNKNOWN';
  }

  /**
   * Extracts the error code from an error response object.
   * @param error - The error response object.
   * @returns The error code string, or `'UNKNOWN'` if not present.
   */
  public getErrorCode(error: HandleErrorAlertModel): string {
    return error?.error?.code ?? 'UNKNOWN';
  }
}
