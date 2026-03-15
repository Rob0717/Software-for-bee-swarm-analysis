import {Routes} from '@angular/router';
import {AuthGuard} from '@app/core/guards/auth.guard';
import {CreateReportComponent} from '@app/pages/reports/presentation/create-report/create-report.component';
import {ReportsComponent} from '@app/pages/reports/presentation/reports/reports.component';

/**
 * Route definitions for the reports section.
 * The reports list route is protected by {@link AuthGuard}, restricting access to authenticated users only.
 */
export const reportRoutes: Routes = [
  {
    path: '',
    component: ReportsComponent,
    canActivate: [AuthGuard],
    data: {
      /** Translation key used to set the page title for the reports list page. */
      titleKey: 'menu.reportList'
    }
  },
  {
    path: 'create',
    component: CreateReportComponent,
    data: {
      /** Translation key used to set the page title for the create report page. */
      titleKey: 'menu.reportCreate'
    }
  },
  {
    /** Catch-all route — redirects any unmatched report paths to the create report page. */
    path: '**',
    redirectTo: 'create'
  }
];
