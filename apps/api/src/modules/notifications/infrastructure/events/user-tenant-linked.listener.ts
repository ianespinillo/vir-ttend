import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserTenantLinkedEvent } from '../../../identity/domain/events/user-tenant-linked.event';
import { EmailPayload } from '../../domain/email-payload';
import { EMAIL_SENDER, EmailSender } from '../../domain/email-sender.interface';

@Injectable()
export class UserTenantLinkedEmailListener {
	private readonly logger = new Logger(UserTenantLinkedEmailListener.name);

	constructor(
		@Inject(EMAIL_SENDER)
		private readonly emailSender: EmailSender,
	) {}

	@OnEvent('user.tenant.linked')
	async handle(event: UserTenantLinkedEvent): Promise<void> {
		try {
			const payload: EmailPayload = {
				to: event.email,
				subject: 'Bienvenido a Vir-ttend',
				template: 'user-tenant-linked',
				context: {
					email: event.email,
					tenantName: event.tenantName,
					role: event.role,
				},
			};
			await this.emailSender.send(payload);
		} catch (error) {
			this.logger.error(
				`Failed to send user-tenant-linked email to ${event.email}: ${
					error instanceof Error ? error.message : String(error)
				}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}
