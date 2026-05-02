import {CommonModule} from '@angular/common';
import {Component, computed, effect, OnInit, signal, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {ConfirmationService, PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {DataView} from 'primeng/dataview';
import {Dialog} from 'primeng/dialog';
import {FloatLabel} from 'primeng/floatlabel';
import {Image} from 'primeng/image';
import {InputText} from 'primeng/inputtext';
import {Message} from 'primeng/message';
import {Select} from 'primeng/select';
import {Splitter} from 'primeng/splitter';
import {Tabs, TabsModule} from 'primeng/tabs';
import {Tag} from 'primeng/tag';
import {asyncScheduler, firstValueFrom, Subject} from 'rxjs';
import {ApiaryFacade} from '@app/pages/auth/base/facades/apiary.facade';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {ReportFacade} from '@app/pages/reports/base/facades/report.facade';
import {MapComponent} from '@shared/components/presentation/generic-map/map.component';
import {ProfileTabEnum} from '@shared/enums/profile-tab.enum';
import {ReportStatusSeverityEnum} from '@shared/enums/report-status-severity.enum';
import {ReportStatus} from '@shared/enums/report-status.enum';
import {UserRoleEnum} from '@shared/enums/user-role.enum';
import {FormHelper} from '@shared/helpers/form.helper';
import {ApiaryCreateRequestDto} from '@shared/models/generated-dtos/apiary-create-request-dto';
import {ApiaryCreateResponseDto} from '@shared/models/generated-dtos/apiary-create-response-dto';
import {ReportResponseDto} from '@shared/models/generated-dtos/report-response-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';
import {LocationDataModel} from '@shared/models/location-data.model';
import {ProfileTabModel} from '@shared/models/profile-tab.model';
import {ReportStatusSeverityModel} from '@shared/models/report-status-severity.model';
import {AlertService} from '@shared/services/alert.service';
import {ProfileTabService} from '@shared/services/profile-tab.service';

/**
 * Profile page component for authenticated users.
 *
 * Displays and manages user-specific data based on their role.
 * Beekeepers have access to apiary management and swarm report tracking,
 * while all users can view their personal information.
 */
@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [
    CommonModule,
    Tabs,
    TabsModule,
    Card,
    TranslocoPipe,
    PrimeTemplate,
    FormsModule,
    Tag,
    Button,
    Dialog,
    MapComponent,
    InputText,
    FloatLabel,
    ReactiveFormsModule,
    DataView,
    Splitter,
    ConfirmDialogModule,
    Image,
    Select,
    Message
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  /** Reference to the active swarms DataView, used to reset pagination after status changes. */
  @ViewChild('activeSwarmsView') activeSwarmsView!: DataView;

  /** Reference to the inactive swarms DataView, used to reset pagination after status changes. */
  @ViewChild('inactiveSwarmsView') inactiveSwarmsView!: DataView;

  protected readonly ProfileTabEnum = ProfileTabEnum;

  /** The currently active profile tab. */
  public activeTabValue: ProfileTabEnum = ProfileTabEnum.MY_DATA;

  /** Tab definitions rendered in the profile tab bar. */
  public tabs: ProfileTabModel[] = [];

  /** Controls visibility of the add apiary dialog. */
  public addApiaryDialogVisible: boolean = false;

  /** Controls visibility of the apiary map overview dialog. */
  public showApiariesDialogVisible: boolean = false;

  /** Reactive signal holding the list of the user's apiaries. */
  public apiaries = signal<ApiaryCreateResponseDto[]>([]);

  /** The currently authenticated user's profile data. */
  public user: UserResponseDto | null = null;

  /** Reactive signal holding swarm reports with an active status (NEW or IN_PROGRESS). */
  public activeSwarms = signal<ReportResponseDto[]>([]);

  /** Reactive signal holding swarm reports with an inactive status (RESOLVED or REJECTED). */
  public inactiveSwarms = signal<ReportResponseDto[]>([]);

  /** Reactive form group for the create apiary dialog. */
  public apiaryForm!: FormGroup;

  /** Whether the apiary creation form is currently being submitted. */
  public isSubmitting: boolean = false;

  /** Subject that emits to trigger a map reset when the apiary dialog is cleared. */
  public clearMap = new Subject<void>();

  /** The location selected by the user on the map in the apiary creation dialog. */
  public selectedLocation: LocationDataModel = {latitude: -1, longitude: -1};

  /** Reactive signal tracking the currently selected status for each swarm report, keyed by report ID. */
  public selectedReportStatuses = signal<Record<string, ReportStatus>>({});

  /** Available report status options mapped to their translation keys, used to fill status dropdowns. */
  public reportStatusFields = Object.values(ReportStatus).map(status => ({
    value: status,
    labelKey: `reportStatus.${status}`
  }));

  /**
   * Computed list of apiary locations derived from the apiaries signal.
   * Used to render markers on the apiary map.
   */
  public apiariesLocations = computed(() =>
    this.apiaries().map(apiary => ({
      latitude: apiary.latitude,
      longitude: apiary.longitude,
      address: apiary.address,
      apiaryName: apiary.apiaryName,
      apiaryRadius: apiary.apiaryRadius,
      apiaryId: apiary.id
    } as LocationDataModel))
  );

  /** Mapping of report statuses to their corresponding PrimeNG tag severity values. */
  private _statusSeverity: Record<ReportStatus, ReportStatusSeverityEnum> = ReportStatusSeverityModel;

  constructor(
    private _authFacade: AuthFacade,
    private _profileTabService: ProfileTabService,
    private _formBuilder: FormBuilder,
    protected _formHelper: FormHelper,
    private _apiaryFacade: ApiaryFacade,
    private _alertService: AlertService,
    public confirmationService: ConfirmationService,
    private _reportFacade: ReportFacade,
    private _translationService: TranslocoService
  ) {
    this._initializeApiaryForm();
    /** Reactive listener upon the signal. */
    effect(() => {
      const req = this._profileTabService.switchRequest();
      if (!req) return;
      this.activeTabValue = req.tab;
    });
  }

  async ngOnInit(): Promise<void> {
    await this._loadUser();
    await this._loadApiaries();
    this._setTabs();
  }

  /**
   * Returns the translation key for a given report status.
   * @param status - The report status value.
   * @returns The translation key string.
   */
  public getReportStatusKey(status: string): string {
    return `reportStatus.${status}`;
  }

  /**
   * Returns the PrimeNG tag severity for a given report status.
   * @param status - The report status to evaluate.
   * @returns The corresponding severity enum value.
   */
  public getSeverity(status: ReportStatus): ReportStatusSeverityEnum {
    return this._statusSeverity[status];
  }

  /**
   * Handles a report status change triggered from the swarm status dropdown.
   * Updates the local status map, persists the change to the backend,
   * and moves the report between active and inactive lists accordingly.
   * @param reportId - The ID of the report to update.
   * @param status - The new status to apply.
   */
  public onReportStatusChange(reportId: number, status: ReportStatus): void {
    const key = reportId.toString();

    this.selectedReportStatuses.update(current => ({
      ...current,
      [key]: status
    }));

    this._changeReportStatus(reportId)
      .then(() => {
        this._alertService.showAlert({
          severity: 'success',
          summary: this._translationService.translate('profile.my_swarms.change_status_title'),
          detail: this._translationService.translate('profile.my_swarms.change_status_message')
        });
      })
      .catch(error => this._alertService.handleErrorAlert(error));
  }

  /**
   * Constructs the URL for a swarm report photo.
   * @param photo - The photo filename.
   * @returns The full URL path to the photo, or undefined if no photo is provided.
   */
  public getSwarmPhotoUrl(photo?: string): string | undefined {
    if (!photo) return undefined;
    return `/uploads/reports/${encodeURIComponent(photo)}`;
  }

  /** Opens the add apiary dialog. */
  public showAddApiaryDialog(): void {
    this.addApiaryDialogVisible = true;
    this.selectedLocation = {latitude: -1, longitude: -1};
  }

  /** Opens the apiary map overview dialog. */
  public showMapOfApiariesDialog(): void {
    this.showApiariesDialogVisible = true;
  }

  /**
   * Handles tab change events from the tab bar.
   * Ignores values that are not valid {@link ProfileTabEnum} entries.
   * @param tab - The newly selected tab value.
   */
  public onTabChange(tab: string | number): void {
    if (!Object.values(ProfileTabEnum).includes(tab as ProfileTabEnum)) return;
    this._profileTabService.setCurrentTab(tab as ProfileTabEnum);
  }

  /**
   * Handles submission of the apiary creation form.
   * Trims the apiary name, validates the form, and calls the apiary facade to create the entry.
   * Updates the apiaries signal on success and resets the dialog.
   */
  public submitCreateApiaryForm(): void {
    this.isSubmitting = true;

    const control = this.apiaryForm.get('apiaryName');
    if (control) {
      control.setValue(control.value.trim());
    }

    if (this.apiaryForm.valid) {
      const apiaryName = this.apiaryForm.get('apiaryName')?.value;
      const apiaryRadius = this.apiaryForm.get('apiaryRadius')?.value;
      const latitude = this.selectedLocation.latitude;
      const longitude = this.selectedLocation.longitude;
      const address = this.selectedLocation?.address;

      const dto: ApiaryCreateRequestDto = {
        apiaryName, apiaryRadius, latitude, longitude, address
      };

      this._apiaryFacade.createApiary(dto)
        .then(async (resultDto) => {
          this._alertService.showAlert({
            summary: this._translationService.translate('profile.apiaries.show.dialog.add.apiary.success.summary'),
            detail: this._translationService.translate('profile.apiaries.show.dialog.add.apiary.success.detail'),
            severity: 'success'
          });
          this.apiaries.update(apiaries => [...apiaries, resultDto]);
          this._clearCreateApiaryDialog();
        })
        .catch(error => {
          this._alertService.handleErrorAlert(error);
        })
        .finally(() => {
          this.isSubmitting = false;
        });
    } else {
      this.isSubmitting = false;
      Object.keys(this.apiaryForm.controls).forEach(key => {
        this.apiaryForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Closes the apiary creation dialog and clears its state after a short delay
   * to allow the close animation to complete before resetting the form and map.
   */
  public closeCreateApiaryDialog(): void {
    this.addApiaryDialogVisible = false;
    const clear = (): void => this._clearCreateApiaryDialog();
    asyncScheduler.schedule(clear, 200);
  }

  /**
   * Handles a location selection event from the map component.
   * Updates the selected location and patches the form with the chosen coordinates.
   * @param location - The location data selected on the map.
   */
  public onApiaryLocationSelected(location: LocationDataModel): void {
    this.selectedLocation = location;
    this.apiaryForm.patchValue({
      latitude: location?.latitude,
      longitude: location?.longitude
    });
  }

  /**
   * Prompts the user to confirm removal of a swarm report from their beekeeper account.
   * Removes the report from both active and inactive swarm lists on confirmation.
   * @param event - The DOM event used to anchor the confirmation dialog.
   * @param id - The ID of the swarm report to remove.
   */
  public removeSwarmFromBeekeeper(event: Event, id: number): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this._translationService.translate('profile.my_swarms.remove.message'),
      header: this._translationService.translate('profile.my_swarms.remove.header'),
      icon: 'pi pi-user-minus',
      acceptLabel: this._translationService.translate('profile.my_swarms.remove.acceptLabel'),
      rejectLabel: this._translationService.translate('profile.my_swarms.remove.rejectLabel'),
      acceptButtonProps: {
        severity: 'danger',
        outlined: true
      },
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true
      },
      accept: () => {
        this._reportFacade.removeSwarmFromBeekeeperById(id)
          .then(() => {
            this.activeSwarms.update(reports => reports.filter(report => report.id !== id));
            this.inactiveSwarms.update(reports => reports.filter(report => report.id !== id));
            this._alertService.showAlert({
              summary: this._translationService.translate('profile.my_swarms.remove.success.summary'),
              detail: this._translationService.translate('profile.my_swarms.remove.success.detail'),
              severity: 'success'
            });
          })
          .catch(error => {
            this._alertService.handleErrorAlert(error);
          });
      }
    });
  }

  /**
   * Prompts the user to confirm deletion of an apiary.
   * Removes the apiary from the signal and shows a success alert on confirmation.
   * @param event - The DOM event used to anchor the confirmation dialog.
   * @param id - The ID of the apiary to delete.
   */
  public deleteApiary(event: Event, id: number): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this._translationService.translate('profile.apiaries.show.dialog.add.apiary.delete.message'),
      header: this._translationService.translate('profile.apiaries.show.dialog.add.apiary.delete.header'),
      icon: 'pi pi-trash',
      acceptLabel: this._translationService.translate('profile.apiaries.show.dialog.add.apiary.delete.acceptLabel'),
      rejectLabel: this._translationService.translate('profile.apiaries.show.dialog.add.apiary.delete.rejectLabel'),
      acceptButtonProps: {
        severity: 'danger',
        outlined: true
      },
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true
      },
      accept: () => {
        this._apiaryFacade.deleteApiaryFromUserById(id)
          .then(() => {
            this.apiaries.update(list => list.filter(a => a.id !== id));
            this._alertService.showAlert({
              summary: this._translationService.translate('profile.apiaries.show.dialog.add.apiary.delete.success.summary'),
              detail: this._translationService.translate('profile.apiaries.show.dialog.add.apiary.delete.success.detail'),
              severity: 'success'
            });
          })
          .catch(error => {
            this._alertService.handleErrorAlert(error);
          });
      }
    });
  }

  /**
   * Initializes the apiary creation form with validation rules.
   */
  private _initializeApiaryForm(): void {
    this.apiaryForm = this._formBuilder.group({
      apiaryName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(60)]],
      apiaryRadius: [null, [Validators.required, Validators.min(1), Validators.max(1000), Validators.pattern(/^\d+$/)]],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required]
    });
  }

  /**
   * Loads the currently authenticated user's profile data from the auth facade.
   */
  private async _loadUser(): Promise<void> {
    await firstValueFrom(this._authFacade.user$())
      .then(user => this.user = user)
      .catch(error => this._alertService.handleErrorAlert(error));
  }

  /**
   * Loads apiaries and swarm reports for the authenticated beekeeper.
   * Splits reports into active and inactive lists and initializes the status selection map.
   * Skips loading if the user is not a beekeeper.
   */
  private async _loadApiaries(): Promise<void> {
    if (this.user?.role !== UserRoleEnum.BEEKEEPER) return;
    const apiaries = await this._apiaryFacade.getApiariesByUser();
    this.apiaries.set(apiaries);
    const swarms = await this._reportFacade.getReportsByUser() ?? [];
    const swarmsActive = swarms?.filter(swarm => swarm.status !== ReportStatus.REJECTED && swarm.status !== ReportStatus.RESOLVED);
    const swarmsInactive = swarms?.filter(swarm => swarm.status !== ReportStatus.NEW && swarm.status !== ReportStatus.IN_PROGRESS);
    this.activeSwarms.set(swarmsActive ?? []);
    this.inactiveSwarms.set(swarmsInactive ?? []);
    this.selectedReportStatuses.set(
      Object.fromEntries(
        swarms.map(r => [
          r.id.toString(),
          r.status as ReportStatus
        ])
      )
    );
  }

  /**
   * Resets the apiary creation dialog by clearing the map selection and resetting the form.
   */
  private _clearCreateApiaryDialog(): void {
    this.clearMap.next();
    this.apiaryForm.reset();
  }

  /**
   * Initializes the profile tab list based on the current user's role,
   * then restores the previously active tab.
   */
  private _setTabs(): void {
    if (this.user) {
      this.tabs = this._profileTabService.getProfileTabsByUserRole(this.user.role as UserRoleEnum, this.user, this.apiaries, this.activeSwarms, this.inactiveSwarms);
    }
    this._setActiveTab();
  }

  /** Restores the active tab from the profile tab service. */
  private _setActiveTab(): void {
    this.activeTabValue = this._profileTabService.currentTab();
  }

  /**
   * Persists a report status change to the backend and updates the active/inactive swarm lists.
   * Moves the report between lists based on the new status and resets DataView paginators.
   * @param id - The ID of the report to update.
   */
  private async _changeReportStatus(id: number): Promise<void> {
    const status = this.selectedReportStatuses()[id.toString()];
    const updatedStatus = await this._reportFacade.changeReportStatusById(id, {status});

    const existingReport =
      this.activeSwarms().find(r => r.id === id) ??
      this.inactiveSwarms().find(r => r.id === id);

    if (!existingReport) return;

    const reportToMove = {
      ...existingReport,
      status: updatedStatus.status
    };

    if (updatedStatus.status === ReportStatus.NEW || updatedStatus.status === ReportStatus.IN_PROGRESS) {
      this.activeSwarms.update(reports => {
        const exists = reports.some(report => report.id === id);
        return exists
          ? reports.map(report => report.id === id ? {...report, status: updatedStatus.status} : report)
          : [...reports, reportToMove].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      });
      this.inactiveSwarms.update(reports =>
        reports.filter(r => r.id !== id)
      );
    } else if (updatedStatus.status === ReportStatus.RESOLVED || updatedStatus.status === ReportStatus.REJECTED) {
      this.activeSwarms.update(reports =>
        reports.filter(r => r.id !== id)
      );
      this.inactiveSwarms.update(reports => {
        const exists = reports.some(r => r.id === id);
        return exists
          ? reports.map(r => r.id === id ? {...r, status: updatedStatus.status} : r)
          : [...reports, reportToMove].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      });
    }

    if (this.activeSwarmsView) {
      this.activeSwarmsView.first = 0;
    }
    if (this.inactiveSwarmsView) {
      this.inactiveSwarmsView.first = 0;
    }
  }
}
