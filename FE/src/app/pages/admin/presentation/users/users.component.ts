import {Component, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {ButtonModule} from 'primeng/button';
import {MultiSelectModule} from 'primeng/multiselect';
import {Select} from 'primeng/select';
import {Table, TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {AdminFacade} from '@app/pages/admin/base/facades/admin.facade';
import {UserRoleEnum} from '@shared/enums/user-role.enum';
import {ManageUserAccessRequestDto} from '@shared/models/generated-dtos/manage-user-access-request-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';
import {HandleErrorAlertModel} from '@shared/models/handle-error-alert.model';
import {SelectOptionModel} from '@shared/models/select-option.model';
import {AlertService} from '@shared/services/alert.service';

/**
 * Admin component for managing registered beekeeper users.
 * Provides a filterable table with options to ban or unban individual users.
 */
@Component({
  standalone: true,
  selector: 'app-users',
  imports: [
    TableModule,
    MultiSelectModule,
    TagModule,
    ButtonModule,
    FormsModule,
    Select,
    TranslocoPipe,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {

  /** Whether the user list is currently being loaded. */
  public loading = true;

  /** Reactive signal holding the list of beekeeper users. */
  public users = signal<UserResponseDto[]>([]);

  /** Currently selected verified status filter. Null means no filter applied. */
  public verifiedFilter: boolean | null = null;

  /** Currently selected banned status filter. Null means no filter applied. */
  public bannedFilter: boolean | null = null;

  /** Options for boolean filter dropdowns (yes/no). */
  public booleanOptions: SelectOptionModel<boolean>[] = [
    {label: 'admin.users.table.bool.yes', value: true},
    {label: 'admin.users.table.bool.no', value: false},
  ];

  constructor(
    private _adminFacade: AdminFacade,
    private _alertService: AlertService,
    private _translationService: TranslocoService
  ) {}

  async ngOnInit(): Promise<void> {
    await this._loadBeekeepers();
  }

  /**
   * Bans or unbans a user by their ID.
   * Updates the local user list on success.
   * @param id - The ID of the user to update.
   * @param banUser - Whether to ban (true) or unban (false) the user.
   */
  public manageUserAccess(id: number, banUser: boolean): void {
    const dto: ManageUserAccessRequestDto = {banUser: banUser};
    this._adminFacade.manageUserAccess(id, dto)
      .then(() => {
        this._alertService.showAlert({
          summary: this._translationService.translate('admin.users.table.button.access.summary'),
          detail: this._translationService.translate('admin.users.table.button.access.detail'),
          severity: 'success'
        });
        this.users.update(users =>
          users.map(user => {
            if (user.id === id) {
              return {...user, banned: banUser}
            } else {
              return user;
            }
          }));
      })
      .catch(error => this._alertService.handleErrorAlert(error));
  }

  /**
   * Clears all active table filters and resets the table to its default state,
   * sorted by user ID ascending.
   * @param table - The PrimeNG Table instance to reset.
   */
  public clearFilters(table: Table): void {
    this.verifiedFilter = null;
    this.bannedFilter = null;
    table.clear();
    table.value = this.users().sort((a, b) => a.id - b.id);
  }

  /**
   * Formats a user's geographic coordinates as a readable string.
   * @param user - The user whose coordinates to display.
   * @returns A formatted string in the form "latitude, longitude".
   */
  public showCoordinates(user: UserResponseDto): string {
    return `${user.latitude}, ${user.longitude}`;
  }

  /**
   * Returns the translated display label for a given user role.
   * @param role - The user role to translate.
   * @returns Translated role label string.
   */
  public showRoleLabel(role: UserRoleEnum): string {
    return role === UserRoleEnum.ADMIN
      ? this._translationService.translate('admin.users.table.role.admin')
      : this._translationService.translate('admin.users.table.role.beekeeper');
  }

  /**
   * Returns the PrimeNG tag severity for a given user role.
   * @param role - The user role to evaluate.
   * @returns `'success'` for admin, `'warning'` for beekeeper.
   */
  public setRoleSeverity(role: UserRoleEnum): 'warning' | 'success' {
    return role === UserRoleEnum.ADMIN ? 'success' : 'warning';
  }

  /**
   * Returns the PrimeNG tag severity for a boolean value.
   * @param value - The boolean to evaluate.
   * @returns `'success'` for true, `'danger'` for false.
   */
  public setBoolSeverity(value: boolean): 'success' | 'danger' {
    return value ? 'success' : 'danger';
  }

  /**
   * Returns the translated yes/no label for a boolean value.
   * @param value - The boolean to translate.
   * @returns Translated label string.
   */
  public showBoolLabel(value: boolean): string {
    return value ? this._translationService.translate('admin.users.table.bool.yes')
      : this._translationService.translate('admin.users.table.bool.no');
  }

  /**
   * Fetches all beekeepers from the admin facade and changes the users signal.
   * Sets loading to false on success, or triggers an error alert on failure.
   */
  private async _loadBeekeepers(): Promise<void> {
    try {
      const list = await this._adminFacade.getAllBeekeepers();
      this.users.set(list ?? []);
      this.loading = false;
    } catch (error) {
      this._alertService.handleErrorAlert(error as HandleErrorAlertModel);
    }
  }
}
