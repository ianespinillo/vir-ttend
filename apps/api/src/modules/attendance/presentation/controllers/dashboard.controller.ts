// modules/attendance/presentation/controllers/dashboard.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';

import { JwtPayload, ROLES } from '@repo/common';

import { CourseSnapshotDto } from '../../application/dtos/course-snapshot.dto';
import { DashboardMetricsResponseDto } from '../../application/dtos/dashboard-metrics.response.dto';
import { PreceptorDashboardResponseDto } from '../../application/dtos/preceptor-dashboard.response.dto';
import { GetCourseDailyOverviewQueryHandler } from '../../application/queries/get-course-daily-overview/get-course-daily-overview.handler';
import { GetCourseDailyOverviewQuery } from '../../application/queries/get-course-daily-overview/get-course-daily-overview.query';
import { GetDashboardMetricsQueryHandler } from '../../application/queries/get-dashboard-metrics/get-dashboard-metrics.handler';
import { GetDashboardMetricsQuery } from '../../application/queries/get-dashboard-metrics/get-dashboard-metrics.query';
import { GetPreceptorDashboardQueryHandler } from '../../application/queries/get-preceptor-dashboard/get-preceptor-dashboard.handler';
import { GetPreceptorDashboardQuery } from '../../application/queries/get-preceptor-dashboard/get-preceptor-dashboard.query';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
@ApiTags('Dashboard')
@ApiCookieAuth('access_token')
export class DashboardController {
	constructor(
		private readonly getPreceptorDashboardQueryHandler: GetPreceptorDashboardQueryHandler,
		private readonly getCourseDailyOverviewQueryHandler: GetCourseDailyOverviewQueryHandler,
		private readonly getDashboardMetricsQueryHandler: GetDashboardMetricsQueryHandler,
	) {}

	@ApiOperation({
		summary: 'Obtener el dashboard del preceptor',
		description:
			'Devuelve el resumen de asistencia de todos los cursos del preceptor autenticado para una fecha. Roles permitidos: preceptor, admin. URL de ejemplo: GET /dashboard?date=2026-03-10. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'date',
		required: true,
		description: 'Fecha del dashboard (YYYY-MM-DD)',
		example: '2026-03-10',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: 'Resumen de los cursos del preceptor',
		type: PreceptorDashboardResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get()
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getDashboard(
		@CurrentUser() user: JwtPayload,
		@Query('date') date: string,
	) {
		return this.getPreceptorDashboardQueryHandler.execute(
			new GetPreceptorDashboardQuery(user.tenantId, user.sub, new Date(date)),
		);
	}

	@ApiOperation({
		summary: 'Obtener el resumen diario de un curso',
		description:
			'Devuelve el resumen de asistencia de un curso para una fecha, incluyendo los campos de CourseSnapshotDto y una propiedad adicional "records" con los registros de asistencia del día. Roles permitidos: preceptor, admin. URL de ejemplo: GET /dashboard/course/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d?date=2026-03-10. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiParam({
		name: 'courseId',
		description: 'Identificador del curso',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	@ApiQuery({
		name: 'date',
		required: true,
		description: 'Fecha del resumen (YYYY-MM-DD)',
		example: '2026-03-10',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description:
			'Resumen del curso (CourseSnapshotDto) junto con el arreglo records de asistencia diaria',
		type: CourseSnapshotDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	@Get('course/:courseId')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getCourseOverview(
		@Param('courseId') courseId: string,
		@Query('date') date: string,
	) {
		return this.getCourseDailyOverviewQueryHandler.execute(
			new GetCourseDailyOverviewQuery(courseId, new Date(date)),
		);
	}

	@ApiOperation({
		summary: 'Obtener las métricas del dashboard del preceptor',
		description:
			'Devuelve las métricas globales de asistencia del preceptor para un año académico: promedio de asistencia, cursos en riesgo y tendencia semanal. Roles permitidos: preceptor, admin. URL de ejemplo: GET /dashboard/metrics?academicYearId=7a1c2b3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'academicYearId',
		required: true,
		description: 'Identificador del año académico',
		example: '7a1c2b3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: 'Métricas del dashboard del preceptor',
		type: DashboardMetricsResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Año académico no encontrado',
	})
	@Get('metrics')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getMetrics(
		@CurrentUser() user: JwtPayload,
		@Query('academicYearId') academicYearId: string,
	) {
		return this.getDashboardMetricsQueryHandler.execute(
			new GetDashboardMetricsQuery(user.sub, academicYearId),
		);
	}
}
