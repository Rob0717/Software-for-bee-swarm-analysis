import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TranslocoPipe} from '@jsverse/transloco';
import {PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {Subject, takeUntil} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {AlertService} from '@shared/services/alert.service';

/**
 * Component that handles email account confirmation.
 * Reads the verification token from the URL query parameters and submits it to the backend.
 * Displays a success or error message based on the result.
 */
@Component({
  standalone: true,
  selector: 'app-confirm-account',
  imports: [
    Card,
    Button,
    RouterLink,
    TranslocoPipe,
    PrimeTemplate
  ],
  templateUrl: './confirm-account.component.html',
  styleUrl: './confirm-account.component.scss'
})
export class ConfirmAccountComponent implements OnInit, OnDestroy {

  /** Translation key for the verification result title. */
  public verificationTitle: string = '';

  /** Translation key for the verification result message. */
  public verificationMessage: string = '';

  /** Whether the account verification completed successfully. */
  public verificationOk: boolean = false;

  /** The verification token extracted from the URL query parameters. */
  private _token: string | null = null;

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _authFacade: AuthFacade,
    private _router: Router,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this._processTokenFromURL();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Reads the verification token from the URL query parameters.
   * Triggers account confirmation if a token is present, otherwise redirects to the home page.
   */
  private _processTokenFromURL(): void {
    this._activatedRoute.queryParamMap
      .pipe(takeUntil(this._destroy$))
      .subscribe(params => {
        this._token = params.get('token');
        if (this._token?.length) {
          this._confirmAccount(this._token);
        } else {
          void this._router.navigate(['/']);
        }
      });
  }

  /**
   * Submits the verification token to the backend to confirm the user's account.
   * Sets the appropriate translation keys for the result title and message on both success and failure.
   * @param token - The verification token to submit.
   */
  private _confirmAccount(token: string): void {
    this._authFacade.confirmAccount(token)
      .then(result => {
        this.verificationTitle = `auth.confirm-account.success.type.${result.type}`;
        this.verificationMessage = `auth.confirm-account.success.code.${result.code}`;
        this.verificationOk = true;
      })
      .catch(error => {
        this.verificationTitle = `error.type.${this._alertService.getErrorType(error)}`;
        this.verificationMessage = `error.code.${this._alertService.getErrorCode(error)}`;
        this.verificationOk = false;
      });
  }
}
