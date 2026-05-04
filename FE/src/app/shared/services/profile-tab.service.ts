import {Injectable, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';
import {ProfileTabEnum} from '@shared/enums/profile-tab.enum';
import {UserRoleEnum} from '@shared/enums/user-role.enum';
import {ApiaryCreateResponseDto} from '@shared/models/generated-dtos/apiary-create-response-dto';
import {ReportResponseDto} from '@shared/models/generated-dtos/report-response-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';
import {ProfileTabModel} from '@shared/models/profile-tab.model';

/**
 * Service for managing the active profile tab state and building role-based tab configurations.
 * Also handles navigation to the profile page when a tab switch is requested from outside the component.
 */
@Injectable({providedIn: 'root'})
export class ProfileTabService {

  /** The currently active profile tab. */
  private readonly _currentTab = signal<ProfileTabEnum>(ProfileTabEnum.MY_DATA);

  /** Public read-only view of the currently active tab. */
  public readonly currentTab = this._currentTab.asReadonly();

  /**
   * Carries an external tab switch request emitted from outside the profile component.
   * The profile component reacts to this signal with an `effect`.
   */
  private readonly _switchRequest = signal<{tab: ProfileTabEnum} | null>(null);

  /** Public read-only view of the current tab switch request. */
  public readonly switchRequest = this._switchRequest.asReadonly();

  constructor(
    private _router: Router
  ) {}

  /**
   * Sets the currently active profile tab without triggering navigation.
   * @param tab - The tab to activate.
   */
  public setCurrentTab(tab: ProfileTabEnum): void {
    this._currentTab.set(tab);
  }

  /**
   * Activates a profile tab and emits a switch request for the profile component to react to.
   * Navigates to the profile page if not already there.
   * @param tab - The tab to open.
   */
  public openProfileTab(tab: ProfileTabEnum): void {
    this._currentTab.set(tab);
    this._switchRequest.set({tab});

    if (this._router.url !== '/auth/profile') {
      void this._router.navigate(['/auth/profile']);
    }
  }

  /**
   * Returns the appropriate tab list for the given user role.
   * Admins receive a reduced tab set; beekeepers receive the full tab set.
   * @param userRole - The role of the current user.
   * @param user - The current user's profile data.
   * @param apiaries - Signal holding the user's apiaries.
   * @param activeSwarms - Signal holding the user's active swarm reports.
   * @param inactiveSwarms - Signal holding the user's inactive swarm reports.
   * @returns An array of profile tab models for the given role.
   */
  public getProfileTabsByUserRole(
    userRole: UserRoleEnum,
    user: UserResponseDto,
    apiaries: WritableSignal<ApiaryCreateResponseDto[]>,
    activeSwarms: WritableSignal<ReportResponseDto[]>,
    inactiveSwarms: WritableSignal<ReportResponseDto[]>
  ): ProfileTabModel[] {
    switch (userRole) {
      case UserRoleEnum.ADMIN:
        return this._getAdminProfileTabs(user);
      case UserRoleEnum.BEEKEEPER:
      default:
        return this._getBeekeeperProfileTabs(user, apiaries, activeSwarms, inactiveSwarms);
    }
  }

  /**
   * Builds the tab list for admin users.
   * Admins only have access to the personal data tab.
   * @param user - The admin user's profile data.
   * @returns An array containing only the personal data tab.
   */
  private _getAdminProfileTabs(user: UserResponseDto | null): ProfileTabModel[] {
    return [this._getMyDataTab(user)];
  }

  /**
   * Builds the full tab list for beekeeper users.
   * Includes personal data, apiaries, active swarms, and inactive swarms tabs.
   * @param user - The beekeeper's profile data.
   * @param apiaries - Signal holding the user's apiaries.
   * @param activeSwarms - Signal holding the user's active swarm reports.
   * @param inactiveSwarms - Signal holding the user's inactive swarm reports.
   * @returns An array of all beekeeper profile tabs.
   */
  private _getBeekeeperProfileTabs(
    user: UserResponseDto | null,
    apiaries: WritableSignal<ApiaryCreateResponseDto[]>,
    activeSwarms: WritableSignal<ReportResponseDto[]>,
    inactiveSwarms: WritableSignal<ReportResponseDto[]>
  ): ProfileTabModel[] {
    return [
      this._getMyDataTab(user),
      {
        title: 'profile.tabs.apiaries',
        value: ProfileTabEnum.APIARIES,
        icon: 'pi pi-map-marker',
        contentTitle: 'profile.apiaries.title',
        contentDescription: 'profile.apiaries.description',
        placeholder: 'profile.placeholder',
        apiariesData: apiaries()
      },
      {
        title: 'profile.tabs.my_active_swarms',
        value: ProfileTabEnum.MY_ACTIVE_SWARMS,
        icon: 'pi pi-list',
        contentTitle: 'profile.my_active_swarms.title',
        contentDescription: 'profile.my_active_swarms.description',
        placeholder: 'profile.placeholder',
        mySwarmsData: activeSwarms()
      },
      {
        title: 'profile.tabs.my_inactive_swarms',
        value: ProfileTabEnum.MY_INACTIVE_SWARMS,
        icon: 'pi pi-list',
        contentTitle: 'profile.my_inactive_swarms.title',
        contentDescription: 'profile.my_inactive_swarms.description',
        placeholder: 'profile.placeholder',
        mySwarmsData: inactiveSwarms()
      }
    ] as ProfileTabModel[];
  }

  /**
   * Builds the personal data tab model filled with the current user's data.
   * @param user - The user's profile data.
   * @returns The personal data tab model.
   */
  private _getMyDataTab(user: UserResponseDto | null): ProfileTabModel {
    return {
      title: 'profile.tabs.my_data',
      value: ProfileTabEnum.MY_DATA,
      icon: 'pi pi-user',
      contentTitle: 'profile.my_data.title',
      contentDescription: 'profile.my_data.description',
      placeholder: 'profile.placeholder',
      userData: user
    } as ProfileTabModel;
  }
}
