import {Injectable} from '@angular/core';
import {TranslocoService} from '@jsverse/transloco';
import {catchError, map, Observable, of} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {ProfileTabEnum} from '@shared/enums/profile-tab.enum';
import {UserRoleEnum} from '@shared/enums/user-role.enum';
import {NavItemModel} from '@shared/models/nav-item.model';
import {AlertService} from '@shared/services/alert.service';
import {ProfileTabService} from '@shared/services/profile-tab.service';

@Injectable({providedIn: 'root'})
export class MenuService {

  constructor(
    private _authFacade: AuthFacade,
    private _profileTabService: ProfileTabService,
    private _alertService: AlertService,
    private _translationService: TranslocoService
  ) {}

  /**
   * Builds and returns menu items based on
   * user logged in status and role.
   */
  public getMenuItems$(): Observable<NavItemModel[]> {
    return this._authFacade.user$().pipe(
      map(user =>
        user ? this._buildLoggedInMenu(user.role === UserRoleEnum.ADMIN) : this._guestSection()
      ),
      catchError(() => of(this._guestSection()))
    );
  }


  /**
   * Returns guest menu items.
   */
  private _guestSection(): NavItemModel[] {
    return [
      {labelKey: 'menu.home', icon: 'pi pi-home', routerLink: '/'},
      {
        labelKey: 'menu.reportsRoot',
        icon: 'pi pi-map-marker',
        items: [
          {labelKey: 'menu.reportCreate', icon: 'pi pi-map', routerLink: '/reports/create'}
        ]
      },
      {
        labelKey: 'menu.accountRoot',
        icon: 'pi pi-briefcase',
        items: [
          {labelKey: 'menu.login', icon: 'pi pi-sign-in', routerLink: '/auth/login'},
          {labelKey: 'menu.register', icon: 'pi pi-user-plus', routerLink: '/auth/register'}
        ]
      }
    ];
  }

  /**
   * Returns beekeeper menu items.
   */
  private _beekeeperSection(): NavItemModel[] {
    return [
      {labelKey: 'menu.home', icon: 'pi pi-home', routerLink: '/'},
      {
        labelKey: 'menu.reportsRoot',
        icon: 'pi pi-map-marker',
        items: [
          {labelKey: 'menu.reportCreate', icon: 'pi pi-map', routerLink: '/reports/create'},
          {labelKey: 'menu.reportList', icon: 'pi pi-list', routerLink: '/reports'}
        ]
      },
      {
        labelKey: 'menu.beekeeperRoot',
        icon: 'pi pi-briefcase',
        items: [
          {
            labelKey: 'menu.profile',
            icon: 'pi pi-user',
            command: () => this._profileTabService.openProfileTab(ProfileTabEnum.MY_DATA)
          },
          {
            labelKey: 'menu.apiaries',
            icon: 'pi pi-warehouse',
            command: () => this._profileTabService.openProfileTab(ProfileTabEnum.APIARIES)
          },
          {
            labelKey: 'menu.myActiveReports',
            icon: 'pi pi-circle-on',
            command: () => this._profileTabService.openProfileTab(ProfileTabEnum.MY_ACTIVE_SWARMS)
          },
          {
            labelKey: 'menu.myInactiveReports',
            icon: 'pi pi-circle-off',
            command: () => this._profileTabService.openProfileTab(ProfileTabEnum.MY_INACTIVE_SWARMS)
          }
        ]
      },
      {
        labelKey: 'menu.logout',
        icon: 'pi pi-sign-out',
        command: () => this._logout()
      }
    ];
  }

  /**
   * Returns admin menu items.
   */
  private _adminSection(): NavItemModel[] {
    return [
      {labelKey: 'menu.home', icon: 'pi pi-home', routerLink: '/'},
      {
        labelKey: 'menu.reportsRoot',
        icon: 'pi pi-map-marker',
        items: [
          {labelKey: 'menu.reportCreate', icon: 'pi pi-map', routerLink: '/reports/create'},
          {labelKey: 'menu.reportList', icon: 'pi pi-list', routerLink: '/reports'}
        ]
      },
      {
        labelKey: 'menu.accountRoot',
        icon: 'pi pi-briefcase',
        items: [
          {
            labelKey: 'menu.profile',
            icon: 'pi pi-user',
            command: () => this._profileTabService.openProfileTab(ProfileTabEnum.MY_DATA)
          }
        ]
      },
      {
        labelKey: 'menu.adminRoot',
        icon: 'pi pi-cog',
        items: [
          {labelKey: 'menu.adminUsers', icon: 'pi pi-users', routerLink: '/admin/users'}
        ]
      },
      {
        labelKey: 'menu.logout',
        icon: 'pi pi-sign-out',
        command: () => this._logout()
      }
    ];
  }

  /**
   * Returns menu items of signed-in user based on role.
   */
  private _buildLoggedInMenu(isAdmin: boolean): NavItemModel[] {
    return isAdmin ? this._adminSection() : this._beekeeperSection();
  }

  /**
   * Signs out the user.
   */
  private _logout(): void {
    this._authFacade.logout()
      .then(() =>
        this._alertService.showAlert({
          summary: this._translationService.translate('auth.logout.success.summary'),
          detail: this._translationService.translate('auth.logout.success.detail'),
          severity: 'success',
        }))
      .catch(error => this._alertService.handleErrorAlert(error));
  }
}
