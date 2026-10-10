import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Transporter, createTransport } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { EmailPayload } from '../domain/email-payload';
import { EmailSender } from '../domain/email-sender.interface';
import { TemplateRenderer } from './template-renderer.service';

export type TransportFactory = (options: SMTPTransport.Options) => Transporter;

const DEFAULT_CAPTURE_PATH = join(process.cwd(), 'logs', 'emails.ndjson');
const DEFAULT_FROM = 'no-reply@vir-ttend.local';

@Injectable()
export class MailerService implements EmailSender {
	private readonly logger = new Logger(MailerService.name);
	private readonly enabled: boolean;
	private readonly capture: boolean;
	private readonly from: string;
	private readonly transport: Transporter | null;
	private readonly capturePath: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly templateRenderer: TemplateRenderer,
		@Optional() transportFactory: TransportFactory = createTransport,
		@Optional() capturePath: string = DEFAULT_CAPTURE_PATH,
	) {
		this.enabled = this.configService.get<boolean>('EMAIL_ENABLED') ?? false;
		this.capturePath = capturePath;
		this.from =
			this.configService.get<string>('SMTP_FROM')?.trim() || DEFAULT_FROM;

		if (!this.enabled) {
			this.logger.log('EMAIL_ENABLED=false - email sending disabled');
			this.capture = false;
			this.transport = null;
			return;
		}

		const host = this.configService.get<string>('SMTP_HOST')?.trim();
		if (!host) {
			this.logger.warn(
				'SMTP_HOST not configured - capture mode: rendered payloads append to logs/emails.ndjson',
			);
			this.capture = true;
			this.transport = null;
			return;
		}

		const port = this.configService.get<number>('SMTP_PORT') ?? 587;
		const user = this.configService.get<string>('SMTP_USER')?.trim();
		const pass = this.configService.get<string>('SMTP_PASS') ?? '';

		this.capture = false;
		const options: SMTPTransport.Options = {
			host,
			port,
			secure: port === 465,
		};
		if (user) {
			options.auth = {
				user,
				pass,
			};
		}
		this.transport = transportFactory(options);
	}

	async send(payload: EmailPayload): Promise<void> {
		if (!this.enabled) {
			return;
		}

		try {
			const html = this.templateRenderer.render(payload.template, payload.context);
			const mail = {
				from: this.from,
				to: payload.to,
				subject: payload.subject,
				html,
			};

			if (this.capture) {
				await this.appendToCapture({
					...mail,
					template: payload.template,
					context: payload.context,
				});
				return;
			}

			await this.transport?.sendMail(mail);
		} catch (error) {
			this.logger.error(
				`Failed to send email to ${payload.to}: ${
					error instanceof Error ? error.message : String(error)
				}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}

	private async appendToCapture(entry: Record<string, unknown>): Promise<void> {
		const dir = dirname(this.capturePath);
		await mkdir(dir, { recursive: true });
		await appendFile(this.capturePath, `${JSON.stringify(entry)}\n`, 'utf8');
	}
}
