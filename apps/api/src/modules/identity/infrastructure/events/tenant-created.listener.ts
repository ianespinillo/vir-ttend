import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TenantCreatedEvent } from '../../domain/events/tenant-created.event';

export class TenantCreatedListener {
	private readonly logger = new Logger(TenantCreatedListener.name);
	@OnEvent('tenant.created')
	execute(event: TenantCreatedEvent) {
		this.logger.log(
			`Tenant with name: ${event.name} and subdomain ${event.subdomain} created at: ${event.ocurredAt.toTimeString()}`,
		);
	}
}
