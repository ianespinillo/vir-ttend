import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PasswordResetRequestedEvent } from '../../../identity/domain/events/password-reset-requested.event';
import { EmailPayload } from '../../domain/email-payload';
import { EMAIL_SENDER, EmailSender } from '../../domain/email-sender.interface';

@Injectable()
export class PasswordResetRequestedEmailListener {
	private readonly logger = new Logger(PasswordResetRequestedEmailListener.name);

	constructor(
		@Inject(EMAIL_SENDER)
		private readonly emailSender: EmailSender,
	) {}

	@OnEvent('user.password-reset-requested')
	async handle(event: PasswordResetRequestedEvent): Promise<void> {
		try {
			const payload: EmailPayload = {
				to: event.email,
				subject: `Vir-ttend: tu código para restablecer la contraseña es ${event.code}`,
				template: 'password-reset-code',
				context: {
					firstName: event.firstName,
					lastName: event.lastName,
					code: event.code,
					expiresInMinutes: event.expiresInMinutes,
				},
			};
			await this.emailSender.send(payload);
		} catch (error) {
			this.logger.error(
				`Failed to send password-reset-code email to ${event.email}: ${
					error instanceof Error ? error.message : String(error)
				}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}
