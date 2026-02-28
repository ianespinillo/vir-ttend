import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IdentityModule } from './modules/identity/identity.module';
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
				type: 'postgresql',
				clientUrl: configService.get<string>('DATABASE_URL'),
				autoLoadEntities: true,
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
	],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(TenantMiddleware).forRoutes('*');
	}
}
