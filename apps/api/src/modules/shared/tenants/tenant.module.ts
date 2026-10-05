import { Global, Module } from '@nestjs/common';
import { PublicConfigController } from './public-config.controller';
import { TenantContextService } from './tenant-context.service';
import { TenantMiddleware } from './tenant.middleware';

@Global()
@Module({
	controllers: [PublicConfigController],
	providers: [TenantContextService, TenantMiddleware],
	exports: [TenantContextService, TenantMiddleware],
})
export class TenantModule {}
