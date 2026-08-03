import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { ChangeMembershipRoleHandler } from './application/commands/change-membership-role/change-membership-role.handler';
import { CreateAnnouncementHandler } from './application/commands/create-announcement/create-announcement.handler';
import { CreateTenantHandler } from './application/commands/create-tenant/create-tenant.handler';
import { CreateUserHandler } from './application/commands/create-user/create-user.handler';
import { DeactivateMembershipHandler } from './application/commands/deactivate-membership/deactivate-membership.handler';
import { DeleteAnnouncementHandler } from './application/commands/delete-announcement/delete-announcement.handler';
import { LoginHandler } from './application/commands/login/login.handler';
import { LogoutHandler } from './application/commands/logout/logout.handler';
import { PublishAnnouncementHandler } from './application/commands/publish-announcement/publish-announcement.handler';
import { RefreshTokenHandler } from './application/commands/refresh-token/refresh-token.handler';
import { SelectTenantHandler } from './application/commands/select-tenant/select-tenant.handler';
import { ToggleTenantStatusHandler } from './application/commands/toggle-tenant-status/toggle-tenant-status.handler';
import { UpdateAnnouncementHandler } from './application/commands/update-announcement/update-announcement.handler';
import { UpdateTenantHandler } from './application/commands/update-tenant/update-tenant.handler';
import { GetAnnouncementHandler } from './application/queries/get-announcement/get-announcement.handler';
import { GetAnnouncementsForUserHandler } from './application/queries/get-announcements-for-user/get-announcements-for-user.handler';
import { GetAnnouncementsHandler } from './application/queries/get-announcements/get-announcements.handler';
import { GetCurrentUserHandler } from './application/queries/get-current-user/get-current-user.handler';
import { GetTenantHandler } from './application/queries/get-tenant/get-tenant.handler';
import { GetUserWithMembershipHandler } from './application/queries/get-user-with-membership/get-user-with-membership.handler';
import { ListTenantsHandler } from './application/queries/list-tenants/list-tenants.handler';
import { ListUsersByTenantHandler } from './application/queries/list-users-by-tenant/list-users-by-tenant.handler';
import { AuthorizationService } from './domain/services/authorization.service';
import { PasswordService } from './domain/services/password.service';
import { TokenService } from './domain/services/token.service';
import { JwtStrategy } from './infrastructure/auth/strategies/jwt.startegy';
import { IdentityEventsModule } from './infrastructure/events/identity.events.module';
import { IdentityPersistenceModule } from './infrastructure/persistence/identity.persistene.module';
import { AnnouncementRepository } from './infrastructure/persistence/repositories/announcement.repository';
import { RefreshTokenRepository } from './infrastructure/persistence/repositories/refresh-token.repository';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';
import { UserTenantMembershipRepository } from './infrastructure/persistence/repositories/user-tenant-membership.repository';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository';
import { AnnouncementsController } from './presentation/controllers/announcements.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { TenantsController } from './presentation/controllers/tenants.controller';
import { UsersController } from './presentation/controllers/users.controller';

// identity.module.ts
@Module({
	imports: [
		IdentityPersistenceModule,
		IdentityEventsModule,
		PassportModule,
		JwtModule.registerAsync({
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '15m' },
			}),
			inject: [ConfigService],
		}),
	],
	exports: ['IUserTenantMembershipRepository'],
	providers: [
		UserTenantMembershipRepository,
		AnnouncementRepository,
		UserRepository,
		{
			provide: 'IUserTenantMembershipRepository',
			useClass: UserTenantMembershipRepository,
		},
		{
			provide: 'IAnnouncementRepository',
			useClass: AnnouncementRepository,
		},
		{
			provide: 'IUserRepository',
			useClass: UserRepository,
		},
		{
			provide: 'ITenantRepository',
			useClass: TenantRepository,
		},
		{
			provide: 'IRefreshTokenRepository',
			useClass: RefreshTokenRepository,
		},
		// Servicios de dominio
		PasswordService,
		TokenService,
		AuthorizationService,

		// Handlers de commands
		CreateUserHandler,
		LoginHandler,
		SelectTenantHandler,
		LogoutHandler,
		RefreshTokenHandler,
		ChangeMembershipRoleHandler,
		CreateTenantHandler,
		DeactivateMembershipHandler,
		ToggleTenantStatusHandler,
		UpdateTenantHandler,
		CreateAnnouncementHandler,
		UpdateAnnouncementHandler,
		PublishAnnouncementHandler,
		DeleteAnnouncementHandler,

		// Handlers de queries
		GetCurrentUserHandler,
		GetTenantHandler,
		GetUserWithMembershipHandler,
		ListTenantsHandler,
		ListUsersByTenantHandler,
		GetAnnouncementsHandler,
		GetAnnouncementHandler,
		GetAnnouncementsForUserHandler,

		// Guards
		JwtAuthGuard,

		// Estrategias
		JwtStrategy,
	],
	controllers: [
		AuthController,
		UsersController,
		TenantsController,
		AnnouncementsController,
	],
})
export class IdentityModule {}
