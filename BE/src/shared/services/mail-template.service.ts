import {Injectable} from '@nestjs/common';
import {I18nService} from 'nestjs-i18n';
import {ReportResponseDto} from '@shared/dto/report/report-response.dto';
import {ConfigService} from '@nestjs/config';

/**
 * Service responsible for generating HTML email templates.
 * All templates are fully internationalized based on the recipient's preferred language.
 * User-provided content is HTML-escaped before being inserted into templates.
 */
@Injectable()
export class MailTemplateService {

  private readonly _verificationTokenDuration: string;
  private readonly _passwordResetTokenDuration: string;

  constructor(
    private _translationService: I18nService,
    private _configService: ConfigService
  ) {
    this._verificationTokenDuration = this._configService.get<string>('JWT_ACCOUNT_VERIFY_SECRET_DURATION')!;
    this._passwordResetTokenDuration = this._configService.get<string>('JWT_RESET_PASSWORD_SECRET_DURATION')!;
  }

  /**
   * Generates an account confirmation email template.
   * @param name - The recipient's first name.
   * @param url - The account confirmation URL containing the verification token.
   * @param language - The preferred language for the email content.
   * @returns The rendered HTML string.
   */
  public userConfirmationTemplate(name: string, url: string, language: string): string {
    const title = this._translationService.translate('common.email.title', {lang: language});
    const subject = this._translationService.translate('common.email.confirmation.subject', {lang: language});
    const greeting = this._translationService.translate('common.email.confirmation.greeting', {lang: language});
    const thankYou = this._translationService.translate('common.email.confirmation.thank-you', {lang: language});
    const button = this._translationService.translate('common.email.confirmation.button', {lang: language});
    const link = this._translationService.translate('common.email.confirmation.link', {lang: language});
    const ignore = this._translationService.translate(
      'common.email.confirmation.ignore',
      {
        lang: language,
        args: {time: this._verificationTokenDuration}
      }
    );

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>${title}</h1>
          <h2 style="color: #2c3e50;">${greeting} ${name}!</h2>

          <p>${thankYou}</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}"
               style="background-color: #3498db; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              ${button}
            </a>
          </div>

          <p>${link}</p>
          <p style="word-break: break-all; color: #3498db;">${url}</p>

          <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">
            ${ignore}
          </p>
        </div>
      </body>
      </html>`;
  }

  /**
   * Generates a password reset email template.
   * @param name - The recipient's first name.
   * @param url - The password reset URL containing the reset token.
   * @param language - The preferred language for the email content.
   * @returns The rendered HTML string.
   */
  public resetPasswordTemplate(name: string, url: string, language: string): string {
    const title = this._translationService.translate('common.email.title', {lang: language});
    const subject = this._translationService.translate('common.email.password-reset.subject', {lang: language});
    const greeting = this._translationService.translate('common.email.password-reset.greeting', {lang: language});
    const info = this._translationService.translate('common.email.password-reset.info', {lang: language});
    const button = this._translationService.translate('common.email.password-reset.button', {lang: language});
    const link = this._translationService.translate('common.email.password-reset.link', {lang: language});
    const ignore = this._translationService.translate(
      'common.email.password-reset.ignore',
      {
        lang: language,
        args: {time: this._passwordResetTokenDuration}
      },
    );

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
          <meta charset="utf-8">
          <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1>${title}</h1>
              <h2 style="color: #e74c3c;">${subject}</h2>

              <p>${greeting} ${name},</p>

              <p>${info}</p>

              <div style="text-align: center; margin: 30px 0;">
                  <a href="${url}"
                     style="background-color: #e74c3c; color: white; padding: 12px 30px;
                            text-decoration: none; border-radius: 5px; display: inline-block;">
                      ${button}
                  </a>
              </div>

              <p>${link}</p>
              <p style="word-break: break-all; color: #e74c3c;">${url}</p>

              <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">
                  ${ignore}
              </p>
          </div>
      </body>
      </html>`;
  }

  /**
   * Generates a swarm handling notification email template for the assigned beekeeper.
   * Includes report description, coordinates, navigation links (Google Maps, Waze, Apple Maps),
   * and an optional photo. All user-provided content is HTML-escaped before rendering.
   * @param name - The recipient's first name.
   * @param language - The preferred language for the email content.
   * @param report - The swarm report data to display in the email.
   * @returns The rendered HTML string.
   */
  public swarmHandlingTemplate(name: string, language: string, report: ReportResponseDto): string {
    const title = this._translationService.translate('common.email.title', {lang: language});
    const subject = this._translationService.translate('common.email.swarm.subject', {lang: language});
    const greeting = this._translationService.translate('common.email.swarm.greeting', {lang: language});
    const info = this._translationService.translate('common.email.swarm.info', {lang: language});
    const swarmInfoLabel = this._translationService.translate('common.email.swarm.swarm-info', {lang: language});
    const swarmCoordsLabel = this._translationService.translate('common.email.swarm.swarm-coordinates', {lang: language});
    const swarmPhotoLabel = this._translationService.translate('common.email.swarm.swarm-photo', {lang: language});
    const swarmNavigate = this._translationService.translate('common.email.swarm.swarm-navigate', {lang: language});

    const dateFormatter = new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Prague',
    });

    const createdAtFormatted = dateFormatter.format(new Date(report.createdAt));

    const safeName = this._escapeHtml(name);
    const safeDescription = this._escapeHtml(report.description ?? '');

    const ll = `${report.latitude},${report.longitude}`;
    const llEnc = encodeURIComponent(ll);

    // Navigation deep links for major mapping applications
    const googleNav = `https://www.google.com/maps/dir/?api=1&destination=${llEnc}&travelmode=driving`;
    const wazeNav = `https://waze.com/ul?ll=${llEnc}&navigate=yes`;
    const appleNav = `https://maps.apple.com/?daddr=${llEnc}&dirflg=d`;

    const rawPhoto = report.photoUrl?.trim();
    const hasPhoto = !!rawPhoto;
    const photoUrl = `${process.env.BACKEND_URL ?? ''}/uploads/reports/${rawPhoto}`;

    return `
      <!DOCTYPE html>
      <html lang="${this._escapeHtml(language)}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${this._escapeHtml(subject)}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background:#f6f7f9; padding: 0; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.06);">
            <h1 style="margin-top:0;">${this._escapeHtml(title)}</h1>

            <h2 style="color:#2c3e50; margin-bottom: 8px;">${this._escapeHtml(subject)}</h2>
            <p style="margin-top:0;">${this._escapeHtml(greeting)} ${safeName},</p>

            <p>${this._escapeHtml(info)}</p>

            <hr style="border:none; border-top:1px solid #eee; margin: 18px 0;">

            <p style="margin: 0 0 6px 0;"><strong>${this._escapeHtml(swarmInfoLabel)}</strong></p>
            <p style="margin: 0 0 14px 0;">${safeDescription || '-'}</p>

            <p style="margin: 0 0 6px 0;"><strong>${this._escapeHtml(swarmCoordsLabel)}</strong></p>
            <p style="margin: 0 0 14px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
              ${this._escapeHtml(ll)}
            </p>

            ${hasPhoto ? `
            <p style="margin: 0 0 6px 0;"><strong>${this._escapeHtml(swarmPhotoLabel)}</strong></p>
            <p style="margin: 0 0 8px 0;">
              <a href="${this._escapeHtml(photoUrl)}" target="_blank" rel="noopener" style="color:#3498db;">${this._escapeHtml(photoUrl)}</a>
            </p>
            <div style="margin: 0 0 14px 0;">
              <img src="${this._escapeHtml(photoUrl)}" alt="Swarm photo" style="max-width:100%; border-radius:8px; border:1px solid #eee;">
            </div>
            ` : ''}

            <p style="margin: 0 0 10px 0;"><strong>${this._escapeHtml(swarmNavigate)}</strong></p>

            <div style="text-align:center; margin: 14px 0 18px 0;">
              <a href="${googleNav}"
                 style="background-color:#27ae60; color:white; padding: 12px 18px; text-decoration:none; border-radius: 6px; display:inline-block;">
                Google Maps
              </a>
            </div>

            <ul style="margin: 0 0 10px 18px; padding: 0;">
              <li style="margin: 6px 0;"><a href="${wazeNav}" target="_blank" rel="noopener" style="color:#3498db;">Waze</a></li>
              <li style="margin: 6px 0;"><a href="${appleNav}" target="_blank" rel="noopener" style="color:#3498db;">Apple Maps</a></li>
            </ul>

            <p style="margin-top: 18px; font-size: 12px; color: #7f8c8d;">
              Report ID: ${this._escapeHtml(report.id)} • Status: ${this._escapeHtml(report.status)} • Created: ${this._escapeHtml(createdAtFormatted)}
            </p>
          </div>
        </div>
      </body>
      </html>`;
  }

  /**
   * Escapes special HTML characters in a value to prevent XSS injection in email templates.
   * Accepts string, number, boolean, Date, null, or undefined and always returns a safe string.
   * @param v - The value to escape.
   * @returns The HTML-escaped string representation of the value.
   */
  private _escapeHtml(v: string | number | boolean | null | undefined | Date): string {
    let s: string;
    if (v === null || v === undefined) s = '';
    else if (v instanceof Date) s = v.toISOString();
    else s = String(v);

    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}