import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslocoPipe} from '@jsverse/transloco';
import {PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {Image} from 'primeng/image';
import {Subject, takeUntil} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {ProfileTabEnum} from '@shared/enums/profile-tab.enum';
import {UserRoleEnum} from '@shared/enums/user-role.enum';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';
import {ProfileTabService} from '@shared/services/profile-tab.service';

/**
 * Home page component displayed at the application root.
 * Renders different content based on whether the user is authenticated,
 * and adapts navigation options according to the user's role.
 */
@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    Button,
    Card,
    Image,
    RouterLink,
    TranslocoPipe,
    PrimeTemplate
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  /** Whether the current user is authenticated. */
  public isUserLoggedIn: boolean = false;

  /** The currently authenticated user's profile data, or null if not logged in. */
  public user: UserResponseDto | null = null;

  protected readonly ProfileTabEnum = ProfileTabEnum;
  protected readonly UserRoleEnum = UserRoleEnum;

  /** Emits when the component is destroyed, used to complete active subscriptions with `takeUntil`. */
  private _destroy$ = new Subject<void>();

  constructor(
    private _authFacade: AuthFacade,
    protected _profileTabService: ProfileTabService
  ) {}

  ngOnInit(): void {
    this._authFacade.loadUser();
    this._authFacade.user$()
      .pipe(takeUntil(this._destroy$))
      .subscribe(user => {
        this.user = user;
        this.isUserLoggedIn = !!user;
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
