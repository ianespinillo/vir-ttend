import { Controller, Get, UseGuards } from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ROLES } from '@repo/common';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { AdminAnalyticsResponseDto } from '../../application/dto/admin-analytics.response.dto';
import { GetAdminAnalyticsHandler } from '../../application/queries/get-admin-analytics/get-admin-analytics.handler';
import { GetAdminAnalyticsQuery } from '../../application/queries/get-admin-analytics/get-admin-analytics.query';

// admin.controller.ts
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@RolesDecorator(ROLES.SUPERADMIN)
@ApiTags('Admin')
@ApiCookieAuth('access_token')
export class AdminController {
	constructor(
		private readonly getAdminAnalyticsHandler: GetAdminAnalyticsHandler,
	) {}

	@Get('analytics')
	@ApiOperation({
		summary: 'Analíticas de la plataforma',
		description:
			'Devuelve métricas globales del sistema para el SUPERADMIN: totales, instituciones con cantidad de usuarios y evolución mensual de creación de instituciones (últimos 6 meses). URL: GET /admin/analytics. La respuesta exitosa se envuelve en { success, data: AdminAnalyticsResponseDto, timeStamp }. Roles permitidos: SUPERADMIN.',
	})
	@ApiResponse({
		status: 200,
		description: 'Analíticas de la plataforma.',
		type: AdminAnalyticsResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async analytics() {
		return this.getAdminAnalyticsHandler.execute(new GetAdminAnalyticsQuery());
	}
}
