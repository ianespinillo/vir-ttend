import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { RefreshTokenOrmEntity } from './entities/refresh-token.orm-entity';
import { UserTenantMembershipOrmEntity } from './entities/user-tenant-membership.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UserTenantMembershipRepository } from './repositories/user-tenant-membership.repository';
import { UserRepository } from './repositories/user.repository';

@Module({
	imports: [
		MikroOrmModule.forFeature([
			UserOrmEntity,
			UserTenantMembershipOrmEntity,
			RefreshTokenOrmEntity,
		]),
	],
	providers: [
		UserRepository,
		UserTenantMembershipRepository,
		RefreshTokenRepository,
	],
	exports: [
		UserRepository,
		UserTenantMembershipRepository,
		RefreshTokenRepository,
	],
})
export class IdentityPersistenceModule {}
