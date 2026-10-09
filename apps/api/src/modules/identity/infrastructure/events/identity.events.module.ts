import { Module } from '@nestjs/common';
import { TenantCreatedListener } from './tenant-created.listener';

@Module({
	providers: [TenantCreatedListener],
})
export class IdentityEventsModule {}
