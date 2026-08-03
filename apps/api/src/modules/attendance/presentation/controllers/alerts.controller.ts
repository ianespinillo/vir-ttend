import {
	Controller,
	Get,
	Param,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtPayload, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';

import { MarkAlertSeenHandler } from '../../application/commands/mark-alert-seen/mark-alert-seen.handler';
import { AlertsCountResponseDto } from '../../application/dtos/alert-count.response.dto';
import { AlertsListResponseDto } from '../../application/dtos/alert-list.response.dto';
import { GetAlertsCountQueryHandler } from '../../application/queries/get-alerts-count/get-alerts-count.handler';
import { GetAlertsQueryHandler } from '../../application/queries/get-alerts/get-alerts.handler';
import { GetStudentAlertsQueryHandler } from '../../application/queries/get-student-alerts/get-student-alerts.handler';
import { GetUnseenAlertsQueryHandler } from '../../application/queries/get-unseen-alerts/get-unseen-alerts.handler';

import { MarkAlertSeenCommand } from '../../application/commands/mark-alert-seen/mark-alert-seen.command';
import { GetAlertsCountQuery } from '../../application/queries/get-alerts-count/get-alerts-count.query';
import { GetAlertsQuery } from '../../application/queries/get-alerts/get-alerts.query';
import { GetStudentAlertsQuery } from '../../application/queries/get-student-alerts/get-student-alerts.query';
import { GetUnseenAlertsQuery } from '../../application/queries/get-unseen-alerts/get-unseen-alerts.query';

@Controller('alerts')
@ApiTags('Alerts')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
	constructor(
		private readonly getAlertsHandler: GetAlertsQueryHandler,
		private readonly getUnseenAlertsHandler: GetUnseenAlertsQueryHandler,
		private readonly getAlertsCountHandler: GetAlertsCountQueryHandler,
		private readonly getStudentAlertsHandler: GetStudentAlertsQueryHandler,
		private readonly markAlertSeenHandler: MarkAlertSeenHandler,
	) {}

	@ApiOperation({
		summary: 'Listar las alertas de asistencia del preceptor',
		description:
			'Devuelve las alertas de asistencia paginadas de los cursos del preceptor autenticado, con filtros opcionales por curso y nivel de alerta. Roles permitidos: preceptor, admin. URL de ejemplo: GET /alerts?courseId=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d&alertType=warning&page=1&limit=20. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'courseId',
		required: false,
		description: 'Identificador del curso para filtrar las alertas',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
		type: String,
	})
	@ApiQuery({
		name: 'alertType',
		required: false,
		description: 'Nivel de alerta para filtrar: warning, critical o exceeded',
		example: 'warning',
		type: String,
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Número de página',
		example: 1,
		type: Number,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Cantidad de alertas por página',
		example: 20,
		type: Number,
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de alertas con total y cantidad de no vistas',
		type: AlertsListResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get()
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getAlerts(
		@CurrentUser() user: JwtPayload,
		@Query('courseId') courseId?: string,
		@Query('alertType') alertType?: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
	) {
		return this.getAlertsHandler.execute(
			new GetAlertsQuery(
				user.tenantId,
				page ? Number(page) : 1,
				limit ? Number(limit) : 20,
				courseId,
				alertType,
			),
		);
	}

	@ApiOperation({
		summary: 'Listar las alertas de asistencia no vistas',
		description:
			'Devuelve únicamente las alertas de asistencia pendientes de revisión de los cursos del preceptor autenticado. Roles permitidos: preceptor, admin. URL de ejemplo: GET /alerts/unseen. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de alertas no vistas',
		type: AlertsListResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get('unseen')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getUnseenAlerts(@CurrentUser() user: JwtPayload) {
		return this.getUnseenAlertsHandler.execute(
			new GetUnseenAlertsQuery(user.tenantId),
		);
	}

	@ApiOperation({
		summary: 'Contar las alertas de asistencia no vistas',
		description:
			'Devuelve la cantidad de alertas de asistencia pendientes de revisión de los cursos del preceptor autenticado. Roles permitidos: preceptor, admin. URL de ejemplo: GET /alerts/count. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiResponse({
		status: 200,
		description: 'Cantidad de alertas no vistas',
		type: AlertsCountResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get('count')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getAlertsCount(@CurrentUser() user: JwtPayload) {
		return this.getAlertsCountHandler.execute(
			new GetAlertsCountQuery(user.tenantId),
		);
	}

	@ApiOperation({
		summary: 'Listar las alertas de un estudiante',
		description:
			'Devuelve las alertas de asistencia de un estudiante dentro del rango del año académico indicado. Roles permitidos: preceptor, admin, teacher. URL de ejemplo: GET /alerts/student/1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f?academicYearId=7a1c2b3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiParam({
		name: 'studentId',
		description: 'Identificador del estudiante',
		example: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
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
		description: 'Alertas de asistencia del estudiante',
		type: AlertsListResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: 'Validación falló o año académico no encontrado',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get('student/:studentId')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN, ROLES.TEACHER)
	async getStudentAlerts(
		@Param('studentId') studentId: string,
		@Query('academicYearId') academicYearId: string,
	) {
		return this.getStudentAlertsHandler.execute(
			new GetStudentAlertsQuery(studentId, academicYearId),
		);
	}

	@ApiOperation({
		summary: 'Marcar una alerta como vista',
		description:
			'Marca una alerta de asistencia como vista por el usuario autenticado. Roles permitidos: preceptor, admin. URL de ejemplo: PATCH /alerts/3f9a4b2c-8d1e-4f6a-9b3c-5d7e8f9a1b2c/seen. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador de la alerta',
		example: '3f9a4b2c-8d1e-4f6a-9b3c-5d7e8f9a1b2c',
	})
	@ApiResponse({
		status: 200,
		description:
			'Alerta marcada como vista. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Alerta no encontrada' })
	@Patch(':id/seen')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async markAsSeen(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.markAlertSeenHandler.execute(
			new MarkAlertSeenCommand(id, user.sub),
		);
	}
}
