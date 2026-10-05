import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { getTenancyConfig } from '../config/tenancy.config';

export class PublicConfigDto {
	tenancyMode!: 'multi' | 'single';
	tenantName!: string;
	tenantSlug!: string | null;
	tenantId!: string | null;
	allowSuperadmin!: boolean;
}

@Controller('config')
@ApiTags('App')
export class PublicConfigController {
	@Get('public')
	@ApiOperation({
		summary: 'Obtener configuración pública de tenancy de la instancia',
		description:
			'Devuelve el modo de tenancy y metadatos públicos de la instancia para que el frontend adapte su navegación y textos.',
	})
	@ApiResponse({
		status: 200,
		description: 'Configuración pública de la instancia.',
		type: PublicConfigDto,
	})
	getPublicConfig(): PublicConfigDto {
		const config = getTenancyConfig();
		return {
			tenancyMode: config.TENANCY_MODE,
			tenantName: config.TENANT_NAME,
			tenantSlug: config.TENANT_SLUG,
			tenantId: config.TENANT_ID,
			allowSuperadmin: config.ALLOW_SUPERADMIN,
		};
	}
}
