import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserTenantLinkedEvent } from '../../domain/events/user-tenant-linked.event';

@Injectable()
export class UserTenantLinkedListener {
	private readonly logger = new Logger(UserTenantLinkedListener.name);

	@OnEvent('user.tenant.linked')
	handle(event: UserTenantLinkedEvent): void {
		this.logger.log(
			`User ${event.email} linked to tenant ${event.tenantId} as ${event.role}`,
		);
	}
}
