import { Module } from '@nestjs/common';
import { UserCreatedListener } from './user-created.listener';
import { UserTenantLinkedListener } from './user-tenant-linked.listener';

@Module({
	providers: [UserCreatedListener, UserTenantLinkedListener],
})
export class IdentityEventsModule {}
