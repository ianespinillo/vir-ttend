import { Module } from '@nestjs/common';
import { TenantCreatedListener } from './tenant-created.listener';
import { UserCreatedListener } from './user-created.listener';
import { UserTenantLinkedListener } from './user-tenant-linked.listener';

@Module({
	providers: [
		UserCreatedListener,
		UserTenantLinkedListener,
		TenantCreatedListener,
	],
})
export class IdentityEventsModule {}
