import { Module } from '@nestjs/common';
import { IdentityPersistenceModule } from '../persistence/identity.persistence.module';
import { NonWorkingDayDeclaredListener } from './non-working-day-declared.listener';
import { TenantCreatedListener } from './tenant-created.listener';

@Module({
	imports: [IdentityPersistenceModule],
	providers: [TenantCreatedListener, NonWorkingDayDeclaredListener],
})
export class IdentityEventsModule {}
