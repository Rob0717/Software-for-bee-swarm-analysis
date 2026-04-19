import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {FileUpload, FileUploadHandlerEvent} from 'primeng/fileupload';
import {Image} from 'primeng/image';
import {Message} from 'primeng/message';
import {Textarea} from 'primeng/textarea';
import {Subject} from 'rxjs';
import {AuthFacade} from '@app/pages/auth/base/facades/auth.facade';
import {ReportFacade} from '@app/pages/reports/base/facades/report.facade';
import {MapComponent} from '@shared/components/presentation/generic-map/map.component';
import {FormHelper} from '@shared/helpers/form.helper';
import {LocationDataModel} from '@shared/models/location-data.model';
import {AlertService} from '@shared/services/alert.service';

/**
 * Component for the create swarm report page.
 * Allows both authenticated and unauthenticated users to submit a swarm report
 * with a description, map location, and an optional photo attachment.
 */
@Component({
  standalone: true,
  selector: 'app-create-report',
  imports: [
    Card,
    Button,
    Textarea,
    FileUpload,
    Image,
    MapComponent,
    Message,
    ReactiveFormsModule,
    TranslocoPipe,
    PrimeTemplate
  ],
  templateUrl: './create-report.component.html',
  styleUrl: './create-report.component.scss'
})
export class CreateReportComponent implements OnInit {

  /** Reference to the PrimeNG FileUpload component, used to clear the selection. */
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  /** The reactive form group for the report creation form. */
  public reportForm!: FormGroup;

  /** Whether the report form submission is currently in progress. */
  public isSubmitting: boolean = false;

  /** URL of the selected photo, used to render a preview before submission. */
  public photoPreview: string | null = null;

  /** Subject that emits to trigger a map reset after successful report submission. */
  public clearMap = new Subject<void>();

  /** The photo file selected by the user, or null if no photo has been chosen. */
  private _selectedPhoto: File | null = null;

  constructor(
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _alertService: AlertService,
    private _reportFacade: ReportFacade,
    private _translationService: TranslocoService,
    private _authFacade: AuthFacade,
    protected _formHelper: FormHelper
  ) {
    this._initializeForm();
  }

  ngOnInit(): void {
    this._authFacade.loadUser();
  }

  /**
   * Handles a location selection event from the map component.
   * Patches the form with the selected coordinates.
   * @param location - The location data selected on the map.
   */
  public onLocationSelected(location: LocationDataModel): void {
    this.reportForm.patchValue({
      latitude: location?.latitude,
      longitude: location?.longitude
    });
  }

  /**
   * Handles a photo selection event from the file upload component.
   * Validates the file size and type, attempts to decode it as an image,
   * and generates a preview on success. Rejects and clears the selection on any validation failure.
   * @param event - The file upload handler event containing the selected files.
   */
  public async onPhotoSelect(event: FileUploadHandlerEvent): Promise<void> {
    const file = event.files[0];
    if (!file) return;

    if (file.size > 10000000) {
      this._alertService.showAlert({
        severity: 'error',
        summary: this._translationService.translate('createReport.alert.errorSummary'),
        detail: this._translationService.translate('createReport.photo.errors.tooLarge')
      });
      this.removePhoto();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this._alertService.showAlert({
        severity: 'error',
        summary: this._translationService.translate('createReport.alert.errorSummary'),
        detail: this._translationService.translate('createReport.photo.errors.invalidType')
      });
      this.removePhoto();
      return;
    }

    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => resolve(e.target?.result as string);
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

    if (!dataUrl) {
      this._alertService.showAlert({
        severity: 'error',
        summary: this._translationService.translate('createReport.alert.errorSummary'),
        detail: this._translationService.translate('createReport.photo.errors.invalidType')
      });
      this.removePhoto();
      return;
    }

    this._selectedPhoto = file;
    this.reportForm.patchValue({photo: file});
    this.photoPreview = dataUrl;
  }

  /**
   * Clears the selected photo, removes the preview, and resets the file upload component.
   */
  public removePhoto(): void {
    this._selectedPhoto = null;
    this.photoPreview = null;
    this.reportForm.patchValue({photo: null});

    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

  /**
   * Handles report form submission.
   * Submits the report to the backend on successful validation, shows a success alert,
   * resets the form and map, then navigates to the home page.
   * Marks all controls as touched on invalid submission to trigger validation messages.
   */
  public async submitForm(): Promise<void> {
    this.isSubmitting = true;

    const description: string = this.reportForm.get('description')?.value;
    this.reportForm.get('description')?.setValue(description.trim());

    if (this.reportForm.valid) {
      try {
        const description = this.reportForm.get('description')?.value;
        const latitude = this.reportForm.get('latitude')?.value;
        const longitude = this.reportForm.get('longitude')?.value;

        await this._reportFacade.createReport(
          description,
          latitude,
          longitude,
          this._selectedPhoto ?? undefined
        );

        this._alertService.showAlert({
          severity: 'success',
          summary: this._translationService.translate('createReport.alert.successSummary'),
          detail: this._translationService.translate('createReport.alert.successSent')
        });

        this.reportForm.reset();
        this.removePhoto();
        this.clearMap.next();

        void this._router.navigate(['/']);

      } catch (error) {
        this._alertService.handleErrorAlert(error as {error: {type: string, code: string}});
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.isSubmitting = false;
      Object.keys(this.reportForm.controls).forEach(key => {
        this.reportForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Handles the cancel action.
   * If the form has unsaved changes (dirty state, selected location, or photo),
   * prompts the user for confirmation before navigating away.
   * Otherwise, navigates to the home page immediately.
   * @param event - The mouse event used to anchor the confirmation dialog.
   */
  public cancel(event: MouseEvent): void {
    if (this.reportForm.dirty || this.reportForm.get('latitude')?.value || this._selectedPhoto) {
      this._alertService.confirmAlert({
        target: event.target as EventTarget,
        header: this._translationService.translate('createReport.cancel.title'),
        message: this._translationService.translate('createReport.cancel.confirm'),
        icon: 'pi pi-pause',
        acceptLabel: this._translationService.translate('createReport.cancel.leave'),
        rejectLabel: this._translationService.translate('createReport.cancel.stay'),
        rejectButtonProps: {
          label: this._translationService.translate('createReport.cancel.stay'),
          severity: 'secondary',
          outlined: true
        },
        acceptButtonProps: {
          label: this._translationService.translate('createReport.cancel.leave'),
          severity: 'danger',
          outlined: true
        },
        accept: () => void this._router.navigate(['/'])
      });
    } else {
      void this._router.navigate(['/']);
    }
  }

  /**
   * Initializes the report creation form with field validators.
   */
  private _initializeForm(): void {
    this.reportForm = this._formBuilder.group({
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      photo: [null]
    });
  }
}
