import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../../identity/domain/events/user-created.event';
import { EmailPayload } from '../../domain/email-payload';
import { EMAIL_SENDER, EmailSender } from '../../domain/email-sender.interface';

@Injectable()
export class UserCreatedEmailListener {
	private readonly logger = new Logger(UserCreatedEmailListener.name);

	constructor(
		@Inject(EMAIL_SENDER)
		private readonly emailSender: EmailSender,
	) {}

	@OnEvent('user.created')
	async handle(event: UserCreatedEvent): Promise<void> {
		try {
			const payload: EmailPayload = {
				to: event.email,
				subject: 'Bienvenido a Vir-ttend: credenciales de acceso',
				template: 'user-created',
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
				`Failed to send user-created email to ${event.email}: ${
					error instanceof Error ? error.message : String(error)
				}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}
