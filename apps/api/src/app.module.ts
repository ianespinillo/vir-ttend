import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { CacheModule } from './modules/shared/cache/cache.module';
import { getEnvs } from './modules/shared/config/app.config';
import { TenantMiddleware } from './modules/shared/tenants/tenant.middleware';
import { TenantModule } from './modules/shared/tenants/tenant.module';

// app.module.ts
@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [getEnvs],
		}),
		MikroOrmModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				driver: PostgreSqlDriver,
				clientUrl: configService.get<string>('DATABASE_URL'),
				autoLoadEntities: true,
				debug: true,
				migrations: {
					path: './src/shared/database/migrations',
				},
			}),
			inject: [ConfigService],
		}),
		EventEmitterModule.forRoot(),
		CacheModule,
		TenantModule,
		IdentityModule,
		AttendanceModule,
		ReportingModule,
		HealthModule,
	],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(TenantMiddleware).forRoutes('*');
	}
}
