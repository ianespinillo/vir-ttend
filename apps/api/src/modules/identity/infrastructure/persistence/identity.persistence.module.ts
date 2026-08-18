import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { AnnouncementOrmEntity } from './entities/announcement.orm-entity';
import { RefreshTokenOrmEntity } from './entities/refresh-token.orm-entity';
import { TenantOrmEntity } from './entities/tenant.orm-entity';
import { UserTenantMembershipOrmEntity } from './entities/user-tenant-membership.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { AnnouncementRepository } from './repositories/announcement.repository';
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
			AnnouncementOrmEntity,
		]),
	],
	providers: [
		{
			provide: UserRepository,
			useFactory: (em: EntityManager) => em.getRepository(UserOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: UserTenantMembershipRepository,
			useFactory: (em: EntityManager) =>
				em.getRepository(UserTenantMembershipOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: RefreshTokenRepository,
			useFactory: (em: EntityManager) => em.getRepository(RefreshTokenOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: TenantRepository,
			useFactory: (em: EntityManager) => em.getRepository(TenantOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: AnnouncementRepository,
			useFactory: (em: EntityManager) => em.getRepository(AnnouncementOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: 'IUserRepository',
			useExisting: UserRepository,
		},
		{
			provide: 'IUserTenantMembershipRepository',
			useExisting: UserTenantMembershipRepository,
		},
		{
			provide: 'IRefreshTokenRepository',
			useExisting: RefreshTokenRepository,
		},
		{
			provide: 'ITenantRepository',
			useExisting: TenantRepository,
		},
		{
			provide: 'IAnnouncementRepository',
			useExisting: AnnouncementRepository,
		},
	],
	exports: [
		UserRepository,
		UserTenantMembershipRepository,
		RefreshTokenRepository,
		TenantRepository,
		AnnouncementRepository,
		'IUserRepository',
		'IUserTenantMembershipRepository',
		'IRefreshTokenRepository',
		'ITenantRepository',
		'IAnnouncementRepository',
	],
})
export class IdentityPersistenceModule {}
