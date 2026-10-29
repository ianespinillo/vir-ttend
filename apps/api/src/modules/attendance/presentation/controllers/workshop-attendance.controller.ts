import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtPayload, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { BulkJustifyWorkshopAttendanceCommand } from '../../application/commands/bulk-justify-workshop-attendance/bulk-justify-workshop-attendance.command';
import { BulkJustifyWorkshopAttendanceHandler } from '../../application/commands/bulk-justify-workshop-attendance/bulk-justify-workshop-attendance.handler';
import { BulkRegisterWorkshopAttendanceCommand } from '../../application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.command';
import { BulkRegisterWorkshopAttendanceHandler } from '../../application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.handler';
import { JustifyWorkshopAttendanceCommand } from '../../application/commands/justify-workshop-attendance/justify-workshop-attendance.command';
import { JustifyWorkshopAttendanceHandler } from '../../application/commands/justify-workshop-attendance/justify-workshop-attendance.handler';
import { MarkWorkshopSessionNotHeldCommand } from '../../application/commands/mark-workshop-session-not-held/mark-workshop-session-not-held.command';
import { MarkWorkshopSessionNotHeldHandler } from '../../application/commands/mark-workshop-session-not-held/mark-workshop-session-not-held.handler';
import { RegisterWorkshopAttendanceCommand } from '../../application/commands/register-workshop-attendance/register-workshop-attendance.command';
import { RegisterWorkshopAttendanceHandler } from '../../application/commands/register-workshop-attendance/register-workshop-attendance.handler';
import { UnmarkWorkshopSessionNotHeldCommand } from '../../application/commands/unmark-workshop-session-not-held/unmark-workshop-session-not-held.command';
import { UnmarkWorkshopSessionNotHeldHandler } from '../../application/commands/unmark-workshop-session-not-held/unmark-workshop-session-not-held.handler';
import { BulkJustifyAttendanceRequestDto } from '../../application/dtos/bulk-justify-attendance.request.dto';
import { JustifyAttendanceRequestDto } from '../../application/dtos/justify-attendance.request.dto';
import {
	MarkWorkshopSessionNotHeldRequestDto,
	WorkshopSessionNotHeldQueryRequestDto,
} from '../../application/dtos/mark-workshop-session-not-held.request.dto';
import {
	BulkRegisterWorkshopAttendanceRequestDto,
	GetMyWorkshopCommissionsRequestDto,
	GetWorkshopAttendanceRequestDto,
	RegisterWorkshopAttendanceRequestDto,
} from '../../application/dtos/workshop-attendance.request.dto';
import {
	MyWorkshopCommissionResponseDto,
	WorkshopAttendanceResponseDto,
} from '../../application/dtos/workshop-attendance.response.dto';
import { WorkshopSessionNotHeldResponseDto } from '../../application/dtos/workshop-session-not-held.response.dto';
import { GetMyWorkshopCommissionsQueryHandler } from '../../application/queries/get-my-workshop-commissions/get-my-workshop-commissions.handler';
import { GetMyWorkshopCommissionsQuery } from '../../application/queries/get-my-workshop-commissions/get-my-workshop-commissions.query';
import { GetWorkshopAttendanceQueryHandler } from '../../application/queries/get-workshop-attendance/get-workshop-attendance.handler';
import { GetWorkshopAttendanceQuery } from '../../application/queries/get-workshop-attendance/get-workshop-attendance.query';
import { GetWorkshopSessionNotHeldQueryHandler } from '../../application/queries/get-workshop-session-not-held/get-workshop-session-not-held.handler';
import { GetWorkshopSessionNotHeldQuery } from '../../application/queries/get-workshop-session-not-held/get-workshop-session-not-held.query';

@Controller('attendance/workshop')
@ApiTags('Attendance')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkshopAttendanceController {
	constructor(
		private readonly registerHandler: RegisterWorkshopAttendanceHandler,
		private readonly bulkRegisterHandler: BulkRegisterWorkshopAttendanceHandler,
		private readonly getAttendanceHandler: GetWorkshopAttendanceQueryHandler,
		private readonly getMyCommissionsHandler: GetMyWorkshopCommissionsQueryHandler,
		private readonly justifyHandler: JustifyWorkshopAttendanceHandler,
		private readonly bulkJustifyHandler: BulkJustifyWorkshopAttendanceHandler,
		private readonly markNotHeldHandler: MarkWorkshopSessionNotHeldHandler,
		private readonly unmarkNotHeldHandler: UnmarkWorkshopSessionNotHeldHandler,
		private readonly getNotHeldHandler: GetWorkshopSessionNotHeldQueryHandler,
	) {}

	@ApiOperation({
		summary: 'Registrar asistencia de taller de una comisión',
		description: `Crea o actualiza la asistencia de taller de los estudiantes activos de una comisión para la fecha indicada. Roles permitidos: admin, y preceptor asignado a la comisión. Body de ejemplo:
{
  "commissionId": "4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d",
  "date": "2026-03-10",
  "records": [{ "studentId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f", "status": "present" }]
}`,
	})
	@ApiResponse({ status: 201, description: 'Asistencia de taller registrada.' })
	@ApiResponse({
		status: 400,
		description: 'Validación falló o hay estudiantes que no son de la comisión',
	})
	@ApiResponse({
		status: 403,
		description: 'No sos el preceptor de la comisión',
	})
	@ApiResponse({ status: 404, description: 'Comisión no encontrada' })
	@Post()
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async register(
		@Body() dto: RegisterWorkshopAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.registerHandler.execute(
			new RegisterWorkshopAttendanceCommand(
				user.tenantId,
				user.sub,
				user.role,
				dto.commissionId,
				new Date(dto.date),
				dto.records.map((r) => ({ studentId: r.studentId, status: r.status })),
			),
		);
	}

	@ApiOperation({
		summary: 'Registrar asistencia de taller masiva para una comisión',
		description:
			'Asigna el mismo estado a todos los estudiantes activos de la comisión en la fecha indicada. Roles permitidos: admin, y preceptor asignado a la comisión.',
	})
	@ApiResponse({ status: 201, description: 'Asistencia masiva registrada.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({
		status: 403,
		description: 'No sos el preceptor de la comisión',
	})
	@ApiResponse({ status: 404, description: 'Comisión no encontrada' })
	@Post('all')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async registerAll(
		@Body() dto: BulkRegisterWorkshopAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.bulkRegisterHandler.execute(
			new BulkRegisterWorkshopAttendanceCommand(
				user.tenantId,
				user.sub,
				user.role,
				dto.commissionId,
				new Date(dto.date),
				dto.status,
			),
		);
	}

	@ApiOperation({
		summary: 'Obtener las comisiones de taller del usuario',
		description:
			'Devuelve las comisiones donde el usuario es preceptor (todas las del tenant para un admin), con el curso, el código y si tienen taller el día de la fecha indicada. URL de ejemplo: GET /attendance/workshop/my-commissions?date=2026-03-10.',
	})
	@ApiResponse({ status: 200, type: [MyWorkshopCommissionResponseDto] })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@Get('my-commissions')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getMyCommissions(
		@Query() dto: GetMyWorkshopCommissionsRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.getMyCommissionsHandler.execute(
			new GetMyWorkshopCommissionsQuery(
				user.tenantId,
				user.sub,
				user.role,
				new Date(dto.date),
			),
		);
	}

	@ApiOperation({
		summary: 'Obtener la asistencia de taller de una comisión',
		description:
			'Devuelve los estudiantes activos de la comisión (ordenados por apellido y nombre) con su estado en la fecha indicada; el estado es null si no se tomó asistencia. URL de ejemplo: GET /attendance/workshop?commissionId=4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d&date=2026-03-10.',
	})
	@ApiResponse({ status: 200, type: WorkshopAttendanceResponseDto })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({
		status: 403,
		description: 'No sos el preceptor de la comisión',
	})
	@ApiResponse({ status: 404, description: 'Comisión no encontrada' })
	@Get()
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getAttendance(
		@Query() dto: GetWorkshopAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.getAttendanceHandler.execute(
			new GetWorkshopAttendanceQuery(
				user.tenantId,
				user.sub,
				user.role,
				dto.commissionId,
				new Date(dto.date),
			),
		);
	}

	@ApiOperation({
		summary: 'Justificar una inasistencia o tardanza de taller',
		description: `Justifica un registro de asistencia de taller identificado por su id, cambiando su estado a justified y guardando el motivo. Roles permitidos: admin, y preceptor asignado a la comisión. URL de ejemplo: POST /attendance/workshop/records/5c4d3e2f-1a2b-3c4d-5e6f-7a8b9c0d1e2f/justify. Body de ejemplo:
{
  "reason": "Certificado médico",
  "notes": "Presenta certificado emitido por el hospital"
}`,
	})
	@ApiParam({
		name: 'recordId',
		description:
			'Identificador del registro de asistencia de taller a justificar',
		example: '5c4d3e2f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
	})
	@ApiResponse({
		status: 201,
		description:
			'Justificación registrada. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({
		status: 400,
		description:
			'Validación falló o el registro no es una inasistencia o tardanza del ciclo lectivo activo',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({
		status: 403,
		description: 'No sos el preceptor de la comisión',
	})
	@ApiResponse({
		status: 404,
		description: 'Registro de asistencia no encontrado',
	})
	@Post('records/:recordId/justify')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async justify(
		@Param('recordId') recordId: string,
		@Body() dto: JustifyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.justifyHandler.execute(
			new JustifyWorkshopAttendanceCommand(
				user.tenantId,
				user.sub,
				user.role,
				recordId,
				dto.reason,
				dto.notes,
			),
		);
	}
	@ApiOperation({
		summary: 'Justificar varias inasistencias o tardanzas de taller',
		description: `Justifica en una sola operación todos los registros de asistencia de taller indicados con el mismo motivo. Es todo o nada: si algún registro no se puede justificar (por ejemplo, de una comisión de otro preceptor) no se guarda ninguno. Roles permitidos: admin, y preceptor asignado a la comisión de cada registro. Body de ejemplo:
{
  "recordIds": ["5c4d3e2f-1a2b-3c4d-5e6f-7a8b9c0d1e2f"],
  "reason": "Certificado médico",
  "notes": "Presenta certificado emitido por el hospital"
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Justificaciones registradas. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }; data es { justified: number }.',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 422,
		description:
			'Algún registro no se puede justificar. No se justificó ninguno y "details" lista cada recordId con su motivo.',
	})
	@Post('records/justify/bulk')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async justifyBulk(
		@Body() dto: BulkJustifyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.bulkJustifyHandler.execute(
			new BulkJustifyWorkshopAttendanceCommand(
				user.tenantId,
				user.sub,
				user.role,
				dto.recordIds,
				dto.reason,
				dto.notes,
			),
		);
	}

	@ApiOperation({
		summary: 'Marcar el taller de una comisión como no dictado',
		description: `Marca que el taller de la comisión no se dictó en la fecha indicada (por ejemplo, por ausencia del docente). Borra los registros de asistencia de taller ya cargados ese día y bloquea nuevos registros hasta desmarcar. Es idempotente: si ya estaba marcado solo actualiza el motivo. Roles permitidos: admin, y preceptor asignado a la comisión. Body de ejemplo:
{
  "commissionId": "4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d",
  "date": "2026-03-10",
  "reason": "Ausencia del docente"
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Taller marcado como no dictado. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }; data es { deletedRecords: number }.',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({
		status: 403,
		description: 'No sos el preceptor de la comisión',
	})
	@ApiResponse({ status: 404, description: 'Comisión no encontrada' })
	@Post('not-held')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async markNotHeld(
		@Body() dto: MarkWorkshopSessionNotHeldRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.markNotHeldHandler.execute(
			new MarkWorkshopSessionNotHeldCommand(
				user.tenantId,
				user.sub,
				user.role,
				dto.commissionId,
				new Date(dto.date),
				dto.reason,
			),
		);
	}

	@ApiOperation({
		summary: 'Quitar la marca de taller no dictado',
		description:
			'Quita la marca de no dictado de la comisión para la fecha indicada y reabre el registro de asistencia. Los registros borrados al marcar no se restauran. Es idempotente. Roles permitidos: admin, y preceptor asignado a la comisión. URL de ejemplo: DELETE /attendance/workshop/not-held?commissionId=4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d&date=2026-03-10.',
	})
	@ApiResponse({
		status: 200,
		description: 'Marca quitada. No devuelve cuerpo.',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({
		status: 403,
		description: 'No sos el preceptor de la comisión',
	})
	@ApiResponse({ status: 404, description: 'Comisión no encontrada' })
	@Delete('not-held')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async unmarkNotHeld(
		@Query() dto: WorkshopSessionNotHeldQueryRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.unmarkNotHeldHandler.execute(
			new UnmarkWorkshopSessionNotHeldCommand(
				user.tenantId,
				user.sub,
				user.role,
				dto.commissionId,
				new Date(dto.date),
			),
		);
	}

	@ApiOperation({
		summary: 'Saber si el taller de una comisión se marcó como no dictado',
		description:
			'Devuelve si el taller de la comisión está marcado como no dictado en la fecha indicada y el motivo informado. Roles permitidos: admin, y preceptor asignado a la comisión. URL de ejemplo: GET /attendance/workshop/not-held?commissionId=4d7a2b1c-3e5f-4a6b-8c9d-0e1f2a3b4c5d&date=2026-03-10.',
	})
	@ApiResponse({ status: 200, type: WorkshopSessionNotHeldResponseDto })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({
		status: 403,
		description: 'No sos el preceptor de la comisión',
	})
	@ApiResponse({ status: 404, description: 'Comisión no encontrada' })
	@Get('not-held')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getNotHeld(
		@Query() dto: WorkshopSessionNotHeldQueryRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.getNotHeldHandler.execute(
			new GetWorkshopSessionNotHeldQuery(
				user.tenantId,
				user.sub,
				user.role,
				dto.commissionId,
				new Date(dto.date),
			),
		);
	}
}
