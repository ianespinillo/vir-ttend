import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../domain/events/user-created.event';

@Injectable()
export class UserCreatedListener {
	private readonly logger = new Logger(UserCreatedListener.name);
	@OnEvent('user.created')
	handle(event: UserCreatedEvent) {
		// TODO: Implement smtp email
		this.logger.log(
			`User created: ${event.email} — password will be sent via SMTP`,
		);
	}
}
