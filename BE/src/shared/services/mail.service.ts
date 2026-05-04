import {Injectable, InternalServerErrorException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {MailTemplateService} from '@shared/services/mail-template.service';
import {I18nService} from 'nestjs-i18n';
import {ReportResponseDto} from '@shared/dto/report/report-response.dto';

/**
 * Service responsible for sending emails via SMTP.
 * Uses Nodemailer as the transport and delegates HTML generation to {@link MailTemplateService}.
 * All email content is internationalized based on the user's preferred language.
 */
@Injectable()
export class MailService {
  private _transporter: nodemailer.Transporter;
  private readonly _host: string;
  private readonly _port: number;
  private readonly _user: string;
  private readonly _pass: string;
  private readonly _frontendUrl: string;

  constructor(
    private _configService: ConfigService,
    private _mailTemplateService: MailTemplateService,
    private _translationService: I18nService
  ) {
    this._host = this._configService.get<string>('SMTP_HOST')!;
    this._port = this._configService.get<number>('SMTP_PORT')!;
    this._user = this._configService.get<string>('SMTP_USER')!;
    this._pass = this._configService.get<string>('SMTP_PASS')!;
    this._frontendUrl = this._configService.get<string>('FRONTEND_URL')!;

    this._transporter = nodemailer.createTransport({
      host: this._host,
      port: this._port,
      secure: this._port === 465,
      auth: {
        user: this._user,
        pass: this._pass,
      },
    });
  }

  /**
   * Sends an account verification email containing a confirmation link.
   * @param token - The JWT confirmation token to include in the verification URL.
   * @param email - The recipient's email address.
   * @param name - The recipient's first name used in the email greeting.
   * @param language - The preferred language for the email content.
   * @throws InternalServerErrorException if the email fails to send.
   */
  public async sendUserConfirmation(token: string, email: string, name: string, language: string): Promise<void> {
    const url = `${this._frontendUrl}/auth/confirm-account?token=${token}`;

    try {
      await this._transporter.sendMail({
        from: `"${this._translationService.translate('common.email.title', {lang: language})}" <${this._user}>`,
        to: email,
        subject: this._translationService.translate('common.email.confirmation.subject', {lang: language}),
        html: this._mailTemplateService.userConfirmationTemplate(name, url, language)
      });
    } catch {
      throw new InternalServerErrorException({type: 'EMAIL_SEND_ERROR', code: 'EMAIL_SEND_ERROR'});
    }
  }

  /**
   * Sends a password reset email containing a reset link.
   * @param token - The JWT reset token to include in the reset URL.
   * @param email - The recipient's email address.
   * @param name - The recipient's first name used in the email greeting.
   * @param language - The preferred language for the email content.
   * @throws InternalServerErrorException if the email fails to send.
   */
  public async sendPasswordReset(token: string, email: string, name: string, language: string): Promise<void> {
    const url = `${this._frontendUrl}/auth/set-new-password?token=${token}`;

    try {
      await this._transporter.sendMail({
        from: `"${this._translationService.translate('common.email.title', {lang: language})}" <${this._user}>`,
        to: email,
        subject: this._translationService.translate('common.email.password-reset.subject', {lang: language}),
        html: this._mailTemplateService.resetPasswordTemplate(name, url, language)
      });
    } catch {
      throw new InternalServerErrorException({type: 'EMAIL_SEND_ERROR', code: 'EMAIL_SEND_ERROR'});
    }
  }

  /**
   * Sends a swarm handling notification email to the beekeeper assigned to a report.
   * Includes report details, coordinates, navigation links, and an optional photo.
   * @param email - The recipient's email address.
   * @param language - The preferred language for the email content.
   * @param name - The recipient's first name used in the email greeting.
   * @param report - The swarm report data to include in the email.
   * @throws InternalServerErrorException if the email fails to send.
   */
  public async sendSwarmHandling(email: string, language: string, name: string, report: ReportResponseDto): Promise<void> {
    try {
      await this._transporter.sendMail({
        from: `"${this._translationService.translate('common.email.title', {lang: language})}" <${this._user}>`,
        to: email,
        subject: this._translationService.translate('common.email.swarm.subject', {lang: language}),
        html: this._mailTemplateService.swarmHandlingTemplate(name, language, report)
      });
    } catch {
      throw new InternalServerErrorException({type: 'EMAIL_SEND_ERROR', code: 'EMAIL_SEND_ERROR'});
    }
  }
}