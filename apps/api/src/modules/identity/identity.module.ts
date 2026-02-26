import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CreateUserHandler } from './application/commands/create-user/create-user.handler';
import { LoginHandler } from './application/commands/login/login.handler';
import { LogoutHandler } from './application/commands/logout/logout.handler';
import { RefreshTokenHandler } from './application/commands/refresh-token/refresh-token.handler';
import { SelectTenantHandler } from './application/commands/select-tenant/select-tenant.handler';
import { GetCurrentUserHandler } from './application/queries/get-current-user/get-current-user.handler';
import { PasswordService } from './domain/services/password.service';
import { TokenService } from './domain/services/token.service';
import { JwtStrategy } from './infrastructure/auth/strategies/jwt.startegy';
import { IdentityEventsModule } from './infrastructure/events/identity.events.module';
import { IdentityPersistenceModule } from './infrastructure/persistence/identity.persistene.module';
import { AuthController } from './presentation/controllers/auth.controller';
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
	providers: [
		// Servicios de dominio
		PasswordService,
		TokenService,

		// Handlers de commands
		CreateUserHandler,
		LoginHandler,
		SelectTenantHandler,
		LogoutHandler,
		RefreshTokenHandler,

		// Handlers de queries
		GetCurrentUserHandler,

		// Guards
		JwtAuthGuard,

		// Estrategias
		JwtStrategy,
	],
	controllers: [AuthController, UsersController],
})
export class IdentityModule {}
