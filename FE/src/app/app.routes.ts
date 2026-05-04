import {Routes} from '@angular/router';
import {ForbiddenComponent} from '@app/pages/forbidden/presentation/forbidden.component';
import {HomeComponent} from '@app/pages/home/presentation/home.component';
import {NotFoundComponent} from '@app/pages/notfound/presentation/notfound.component';

/**
 * Root route definitions for the application.
 */
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: {
      /** Translation key used to set the page title for the home page. */
      titleKey: 'menu.home'
    }
  },
  {
    /** Lazy-loaded auth feature module. */
    path: 'auth',
    loadChildren: () => import('@app/pages/auth/routes/auth.routes').then(m => m.authRoutes)
  },
  {
    /** Lazy-loaded reports feature module. */
    path: 'reports',
    loadChildren: () => import('@app/pages/reports/routes/report.routes').then(m => m.reportRoutes)
  },
  {
    /** Lazy-loaded admin feature module. */
    path: 'admin',
    loadChildren: () => import('@app/pages/admin/routes/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: 'notfound',
    component: NotFoundComponent,
    data: {
      /** Translation key used to set the page title for the not found page. */
      titleKey: 'notfound.tag'
    }
  },
  {
    path: 'forbidden',
    component: ForbiddenComponent,
    data: {
      /** Translation key used to set the page title for the forbidden page. */
      titleKey: 'forbidden.tag'
    }
  },
  {
    /** Catch-all route — redirects any unmatched paths to the not found page. */
    path: '**',
    redirectTo: 'notfound',
    pathMatch: 'full'
  }
];
