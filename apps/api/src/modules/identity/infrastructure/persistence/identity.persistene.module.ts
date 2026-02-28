import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { RefreshTokenOrmEntity } from './entities/refresh-token.orm-entity';
import { TenantOrmEntity } from './entities/tenant.orm-entity';
import { UserTenantMembershipOrmEntity } from './entities/user-tenant-membership.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { TenantRepository } from './repositories/tenant.repository';
import { UserTenantMembershipRepository } from './repositories/user-tenant-membership.repository';
import { UserRepository } from './repositories/user.repository';

@Module({
	imports: [
		MikroOrmModule.forFeature([
			UserOrmEntity,
			UserTenantMembershipOrmEntity,
			RefreshTokenOrmEntity,
			TenantOrmEntity,
		]),
	],
	providers: [
		UserRepository,
		UserTenantMembershipRepository,
		RefreshTokenRepository,
		TenantRepository,
	],
	exports: [
		UserRepository,
		UserTenantMembershipRepository,
		RefreshTokenRepository,
		TenantRepository,
	],
})
export class IdentityPersistenceModule {}
