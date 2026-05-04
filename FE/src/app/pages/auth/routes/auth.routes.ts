import {Routes} from '@angular/router';
import {AuthGuard} from '@app/core/guards/auth.guard';
import {UnregisteredGuard} from '@app/core/guards/unregistered.guard';
import {ConfirmAccountComponent} from '@app/pages/auth/presentation/confirm-account/confirm-account.component';
import {ForgottenPasswordComponent} from '@app/pages/auth/presentation/forgotten-password/forgotten-password.component';
import {LoginComponent} from '@app/pages/auth/presentation/login/login.component';
import {ProfileComponent} from '@app/pages/auth/presentation/profile/profile.component';
import {RegisterComponent} from '@app/pages/auth/presentation/register/register.component';
import {SetNewPasswordComponent} from '@app/pages/auth/presentation/set-new-password/set-new-password.component';

/**
 * Route definitions for the auth section.
 * Public routes are protected by {@link UnregisteredGuard}, preventing
 * already authenticated users from accessing them.
 * The profile route is protected by {@link AuthGuard}, restricting access to authenticated users only.
 */
export const authRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [UnregisteredGuard],
    data: {
      /** Translation key used to set the page title for the login page. */
      titleKey: 'menu.login'
    }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [UnregisteredGuard],
    data: {
      /** Translation key used to set the page title for the registration page. */
      titleKey: 'menu.register'
    }
  },
  {
    path: 'confirm-account',
    component: ConfirmAccountComponent,
    canActivate: [UnregisteredGuard],
    data: {
      /** Translation key used to set the page title for the account confirmation page. */
      titleKey: 'auth.confirm-account.title'
    }
  },
  {
    path: 'forgotten-password',
    component: ForgottenPasswordComponent,
    canActivate: [UnregisteredGuard],
    data: {
      /** Translation key used to set the page title for the forgotten password page. */
      titleKey: 'auth.forgotten-password.title'
    }
  },
  {
    path: 'set-new-password',
    component: SetNewPasswordComponent,
    canActivate: [UnregisteredGuard],
    data: {
      /** Translation key used to set the page title for the set new password page. */
      titleKey: 'auth.set-new-password.title'
    }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: {
      /** Translation key used to set the page title for the profile page. */
      titleKey: 'menu.profile'
    }
  },
  {
    /** Catch-all route — redirects any unmatched auth paths to the not found page. */
    path: '**',
    redirectTo: '/notfound',
    pathMatch: 'full'
  }
];
