import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ChangeReportStatusRequestDto} from '@shared/models/generated-dtos/change-report-status-request-dto';
import {ChangeReportStatusResponseDto} from '@shared/models/generated-dtos/change-report-status-response-dto';
import {ReportResponseDto} from '@shared/models/generated-dtos/report-response-dto';
import {environment} from '../../../../../../environment';

/**
 * Repository responsible for swarm report-related HTTP communication.
 * Provides direct access to the report management API endpoints.
 */
@Injectable({providedIn: 'root'})
export class ReportRepository {

  constructor(
    private _httpClient: HttpClient
  ) {}

  /**
   * Fetches all swarm reports.
   * @returns An observable resolving to an array of all report response objects.
   */
  public getAllReports$(): Observable<ReportResponseDto[]> {
    return this._httpClient.get<ReportResponseDto[]>(
      `${environment.apiUrl}/reports`
    );
  }

  /**
   * Creates a new swarm report from a multipart FormData payload.
   * @param formData - The form data containing report details and optional photo.
   * @returns An observable resolving to the created report response.
   */
  public createReport$(formData: FormData): Observable<ReportResponseDto> {
    return this._httpClient.post<ReportResponseDto>(
      `${environment.apiUrl}/reports`,
      formData
    );
  }

  /**
   * Fetches all swarm reports belonging to the currently authenticated user.
   * @returns An observable resolving to an array of the user's reports, or null if none exist.
   */
  public getReportsByUser$(): Observable<ReportResponseDto[] | null> {
    return this._httpClient.get<ReportResponseDto[] | null>(
      `${environment.apiUrl}/reports/user`
    );
  }

  /**
   * Updates the status of a specific swarm report.
   * @param id - The ID of the report to update.
   * @param status - The request payload containing the new status.
   * @returns An observable resolving to the updated report response.
   */
  public changeReportStatusById$(id: number, status: ChangeReportStatusRequestDto): Observable<ChangeReportStatusResponseDto> {
    return this._httpClient.patch<ReportResponseDto>(
      `${environment.apiUrl}/reports/${id}/status`,
      status
    );
  }

  /**
   * Deletes a swarm report by its ID.
   * @param id - The ID of the report to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  public deleteReport$(id: number): Observable<void> {
    return this._httpClient.delete<void>(
      `${environment.apiUrl}/reports/${id}`
    );
  }

  /**
   * Assigns the currently authenticated beekeeper as the handler of a swarm report.
   * @param id - The ID of the report to take over.
   * @returns An observable that completes when the take-over is successful.
   */
  public takeOverReport$(id: number): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}/reports/${id}/takeover`,
      {}
    );
  }

  /**
   * Removes the association between a swarm report and the currently authenticated beekeeper.
   * @param id - The ID of the report to disassociate from the beekeeper.
   * @returns An observable that completes when the removal is successful.
   */
  public removeSwarmFromBeekeeperById$(id: number): Observable<void> {
    return this._httpClient.patch<void>(
      `${environment.apiUrl}/reports/${id}/remove`,
      {}
    );
  }
}
