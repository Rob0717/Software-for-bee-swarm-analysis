import {Routes} from '@angular/router';
import {AdminGuard} from '@app/core/guards/admin.guard';
import {UsersComponent} from '@app/pages/admin/presentation/users/users.component';

/**
 * Route definitions for the admin section.
 * {@link AdminGuard} provides route protection, restricting access to admin users only.
 */
export const adminRoutes: Routes = [
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [AdminGuard],
    data: {
      /** Translation key used to set the page title for the users management page. */
      titleKey: 'menu.adminUsers'
    }
  },
  {
    /** Catch-all route — redirects any unmatched admin paths to the not found page. */
    path: '**',
    redirectTo: '/notfound',
    pathMatch: 'full'
  }
]
