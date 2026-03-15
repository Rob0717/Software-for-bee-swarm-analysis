import {DatePipe} from '@angular/common';
import {Component, OnInit, signal, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {ButtonModule} from 'primeng/button';
import {Dialog} from 'primeng/dialog';
import {Image} from 'primeng/image';
import {MultiSelect, MultiSelectModule} from 'primeng/multiselect';
import {Table, TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {firstValueFrom} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {ReportFacade} from '@app/pages/reports/base/facades/report.facade';
import {MapComponent} from '@shared/components/generic-map/map.component';
import {ReportStatusSeverityEnum} from '@shared/enums/report-status-severity.enum';
import {ReportStatus} from '@shared/enums/report-status.enum';
import {UserRoleEnum} from '@shared/enums/user-role.enum';
import {ReportResponseDto} from '@shared/models/generated-dtos/report-response-dto';
import {UserResponseDto} from '@shared/models/generated-dtos/user-response-dto';
import {LocationDataModel} from '@shared/models/location-data.model';
import {MultiSelectOptionModel} from '@shared/models/multiselect-option.model';
import {ReportStatusSeverityModel} from '@shared/models/report-status-severity.model';
import {ReportsTableRowModel} from '@shared/models/reports-table-row.model';
import {AlertService} from '@shared/services/alert.service';

/**
 * Component for the swarm reports list page.
 * Displays all reports in a filterable table with role-based actions.
 * Admins can delete reports; beekeepers can take over unassigned reports.
 */
@Component({
  standalone: true,
  selector: 'app-reports',
  imports: [
    TableModule,
    MultiSelectModule,
    TagModule,
    ButtonModule,
    FormsModule,
    DatePipe,
    TranslocoPipe,
    Image,
    Dialog,
    MapComponent
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {

  /** Reference to the assigned beekeepers MultiSelect, used to reset its filter on table clear. */
  @ViewChild('assignedBeekeepers') assignedBeekeepers!: MultiSelect;

  /** The currently authenticated user's profile data. */
  public user: UserResponseDto | null = null;

  /** Whether the reports list is currently being loaded. */
  public loading = true;

  /** Reactive signal holding the list of report table rows. */
  reports = signal<ReportsTableRowModel[]>([]);

  protected readonly UserRoleEnum = UserRoleEnum;

  /** Currently selected report status filter values. */
  public statusFilter: ReportStatus[] = [];

  /** Currently selected assigned beekeeper filter values. Null entries represent unassigned reports. */
  public assignedFilter: string[] | null = [];

  /** Available beekeeper options for the assigned filter dropdown, including an unassigned option. */
  public beekeeperOptions: MultiSelectOptionModel<string | null>[] = [];

  /** Available status options for the status filter dropdown. */
  public statusOptions: {value: ReportStatus}[] = [
    {value: ReportStatus.NEW},
    {value: ReportStatus.IN_PROGRESS},
    {value: ReportStatus.RESOLVED},
    {value: ReportStatus.REJECTED},
  ];

  /** Location of reported swarm shown on the map. */
  public selectedReport: LocationDataModel | undefined = undefined;

  /** Whether to show dialog with map containing reported swarm location. */
  public showSwarmDialogVisible = false;

  /** Mapping of report statuses to their corresponding PrimeNG tag severity values. */
  private _statusSeverity: Record<ReportStatus, ReportStatusSeverityEnum> = ReportStatusSeverityModel;

  /** Numeric sort order for each report status, used to enable consistent status-based sorting. */
  private readonly _statusOrder: Record<ReportStatus, number> = {
    new: 1,
    in_progress: 2,
    resolved: 3,
    rejected: 4,
  };

  constructor(
    private _reportFacade: ReportFacade,
    private _authFacade: AuthFacade,
    private _alertService: AlertService,
    private _translationService: TranslocoService
  ) {}

  /**
   * Loads the authenticated user and all swarm reports on component initialization.
   * Maps raw report data into table row models with pre-computed display fields,
   * and builds the list of unique beekeeper filter options.
   */
  async ngOnInit(): Promise<void> {
    firstValueFrom(this._authFacade.user$())
      .then(user => this.user = user)
      .catch(error => this._alertService.handleErrorAlert(error));

    const reports = await this._reportFacade.getAllReports();

    const rows: ReportsTableRowModel[] = (reports ?? []).map((r) => {
      const assignedKey = this.assignedToFullName(r);
      return {
        ...r,
        createdAtDate: new Date(r.createdAt),
        updatedAtDate: new Date(r.updatedAt),
        assignedKey: assignedKey === '—' ? null : assignedKey,
        statusOrder: this._statusOrder[r.status],
      };
    });

    const uniqueBeekeepers = new Set<string>();
    for (const r of rows) {
      if (r.assignedKey) uniqueBeekeepers.add(r.assignedKey);
    }

    this.beekeeperOptions = [
      {labelKey: 'reports.filters.unassigned', value: null},
      ...Array.from(uniqueBeekeepers).sort().map((name) => ({label: name, value: name})),
    ];

    this.reports.set(rows);
    this.loading = false;
  }

  /**
   * Shows the map with the reported swarm location.
   * @param report - Reported swarm from the table.
   */
  public showSwarmLocation(report: ReportsTableRowModel): void {
    this.selectedReport = {
      displayName: report.description,
      latitude: report.latitude,
      longitude: report.longitude
    };
    this.showSwarmDialogVisible = true;
  }

  /**
   * Clears all active table filters and resets the table to its default state,
   * sorted by creation date descending.
   * @param table - The PrimeNG Table instance to reset.
   */
  public clear(table: Table): void {
    this.statusFilter = [];
    this.assignedFilter = [];
    this.assignedBeekeepers.resetFilter();
    table.clear();
    table.value = this.reports().sort((a, b) => b.createdAtDate.getTime() - a.createdAtDate.getTime());
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
   * Constructs the URL for a report photo.
   * @param photo - The photo filename.
   * @returns The full URL path to the photo, or undefined if no photo is provided.
   */
  public getReportPhotoUrl(photo?: string): string | undefined {
    if (!photo) return undefined;
    return `/uploads/reports/${encodeURIComponent(photo)}`;
  }

  /**
   * Formats the assigned beekeeper's full name from a report response.
   * @param r - The report response object.
   * @returns The beekeeper's full name, or `'—'` if the report is unassigned.
   */
  public assignedToFullName(r: ReportResponseDto): string {
    const parts = [r.assignedToUserName, r.assignedToUserSurname].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }

  /**
   * Formats a report's geographic coordinates as a readable string.
   * @param r - The report response object.
   * @returns A formatted string in the form "latitude, longitude".
   */
  public coords(r: ReportResponseDto): string {
    return `${r.latitude}, ${r.longitude}`;
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
   * Dispatches the appropriate row action based on the current user's role.
   * Admins trigger a delete confirmation; beekeepers trigger a report take-over.
   * @param event - The DOM event used to anchor the confirmation dialog for admins.
   * @param report - The report table row on which the action was triggered.
   */
  public onControlClick(event: Event, report: ReportsTableRowModel): void {
    switch (this.user?.role) {
      case UserRoleEnum.ADMIN:
        this._deleteReport(event, report);
        break;
      case UserRoleEnum.BEEKEEPER:
      default:
        this._takeOverReport(report);
        break;
    }
  }

  /**
   * Prompts the admin to confirm deletion of a report.
   * Removes the report from the signal and shows a success alert on confirmation.
   * @param event - The DOM event used to anchor the confirmation dialog.
   * @param report - The report to delete.
   */
  private _deleteReport(event: Event, report: ReportsTableRowModel): void {
    this._alertService.confirmAlert({
      target: event.target as EventTarget,
      message: this._translationService.translate('reports.confirmDelete.message'),
      header: this._translationService.translate('reports.confirmDelete.header'),
      icon: 'pi pi-trash',
      acceptLabel: this._translationService.translate('reports.confirmDelete.accept'),
      rejectLabel: this._translationService.translate('reports.confirmDelete.reject'),
      rejectButtonProps: {
        label: this._translationService.translate('reports.confirmDelete.reject'),
        severity: 'secondary',
        outlined: true,
        position: 'right'
      },
      acceptButtonProps: {
        label: this._translationService.translate('reports.confirmDelete.accept'),
        severity: 'danger',
        outlined: true,
        position: 'left'
      },
      accept: () => {
        this._reportFacade.deleteReport(report.id)
          .then(() => {
            this.reports.update(reports => reports.filter(rep => rep.id !== report.id));
            this._alertService.showAlert({
              severity: 'success',
              summary: this._translationService.translate('reports.alert.deleteSuccess.summary'),
              detail: this._translationService.translate('reports.alert.deleteSuccess.detail')
            });
          })
          .catch(error => {
            this._alertService.handleErrorAlert(error);
          });
      }
    });
  }

  /**
   * Assigns the currently authenticated beekeeper to the given report.
   * Updates the report row in the signal with the beekeeper's name, IN_PROGRESS status,
   * and a refreshed updated-at timestamp on success.
   * @param reportToTakeOver - The report table row to take over.
   */
  private _takeOverReport(reportToTakeOver: ReportsTableRowModel): void {
    this._reportFacade.takeOverReport(reportToTakeOver.id)
      .then(() => {
        const name = this.user?.name ?? '';
        const surname = this.user?.surname ?? '';
        const assignedKey = [name, surname].filter(Boolean).join(' ').trim() || null;
        const now = new Date();

        this.reports.update(list =>
          list.map(report =>
            report.id === reportToTakeOver.id
              ? {
                ...report,
                assignedToUserName: name,
                assignedToUserSurname: surname,
                assignedKey,
                status: ReportStatus.IN_PROGRESS,
                statusOrder: this._statusOrder[ReportStatus.IN_PROGRESS],
                updatedAtDate: now,
                updatedAt: now.toISOString(),
              }
              : report
          )
        );

        this._alertService.showAlert({
          severity: 'success',
          summary: this._translationService.translate('reports.alert.takeOverSuccess.summary'),
          detail: this._translationService.translate('reports.alert.takeOverSuccess.detail'),
        });
      })
      .catch(error => this._alertService.handleErrorAlert(error));
  }
}
