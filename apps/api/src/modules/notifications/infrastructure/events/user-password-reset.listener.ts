import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserPasswordResetEvent } from '../../../identity/domain/events/user-password-reset.event';
import { EmailPayload } from '../../domain/email-payload';
import { EMAIL_SENDER, EmailSender } from '../../domain/email-sender.interface';

@Injectable()
export class UserPasswordResetEmailListener {
	private readonly logger = new Logger(UserPasswordResetEmailListener.name);

	constructor(
		@Inject(EMAIL_SENDER)
		private readonly emailSender: EmailSender,
	) {}

	@OnEvent('user.password-reset')
	async handle(event: UserPasswordResetEvent): Promise<void> {
		try {
			const payload: EmailPayload = {
				to: event.email,
				subject: 'Vir-ttend: tu contraseña fue restablecida',
				template: 'user-password-reset',
				context: {
					firstName: event.firstName,
					lastName: event.lastName,
					email: event.email,
					rawPassword: event.rawPassword,
				},
			};
			await this.emailSender.send(payload);
		} catch (error) {
			this.logger.error(
				`Failed to send user-password-reset email to ${event.email}: ${
					error instanceof Error ? error.message : String(error)
				}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}
