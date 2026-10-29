import {
	Body,
	Controller,
	Delete,
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
// attendance-command.controller.ts
import { JwtPayload, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { BulkJustifyAttendanceCommand } from '../../application/commands/bulk-justify-attendance/bulk-justify-attendance.command';
import { BulkJustifyAttendanceHandler } from '../../application/commands/bulk-justify-attendance/bulk-justify-attendance.handler';
import { BulkRegisterAttendanceCommand } from '../../application/commands/bulk-register-attendance/bulk-register-attendance.command';
import { BulkRegisterAttendanceHandler } from '../../application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { BulkUpdateSubjectStatusCommand } from '../../application/commands/bulk-update-subject-status/bulk-update-subject-status.command';
import { BulkUpdateSubjectStatusHandler } from '../../application/commands/bulk-update-subject-status/bulk-update-subject-status.handler';
import { CopyAttendanceCommand } from '../../application/commands/copy-attendance/copy-attendance.command';
import { CopyAttendanceHandler } from '../../application/commands/copy-attendance/copy-attendance.handler';
import { CopyDailyAttendanceCommand } from '../../application/commands/copy-daily-attendance/copy-daily-attendance.command';
import { CopyDailyAttendanceHandler } from '../../application/commands/copy-daily-attendance/copy-daily-attendance.handler';
import { JustifyAttendanceCommand } from '../../application/commands/justify-attendance/justify-attendance.command';
import { JustifyAttendanceHandler } from '../../application/commands/justify-attendance/justify-attendance.handler';
import { MarkDailySessionNotHeldCommand } from '../../application/commands/mark-daily-session-not-held/mark-daily-session-not-held.command';
import { MarkDailySessionNotHeldHandler } from '../../application/commands/mark-daily-session-not-held/mark-daily-session-not-held.handler';
import { RegisterDailyAttendanceCommand } from '../../application/commands/register-daily-attendance/register-daily-attendance.command';
import { RegisterDailyAttendanceHandler } from '../../application/commands/register-daily-attendance/register-daily-attendance.handler';
import { RegisterSubjectAttendanceCommand } from '../../application/commands/register-subject-attendance/register-subject-attendance.command';
import { RegisterSubjectAttendanceHandler } from '../../application/commands/register-subject-attendance/register-subject-attendance.handler';
import { UnmarkDailySessionNotHeldCommand } from '../../application/commands/unmark-daily-session-not-held/unmark-daily-session-not-held.command';
import { UnmarkDailySessionNotHeldHandler } from '../../application/commands/unmark-daily-session-not-held/unmark-daily-session-not-held.handler';
import { BulkJustifyAttendanceRequestDto } from '../../application/dtos/bulk-justify-attendance.request.dto';
import { BulkRegisterAttendanceRequestDto } from '../../application/dtos/bulk-register-attendance.request.dto';
import { BulkUpdateSubjectStatusRequestDto } from '../../application/dtos/bulk-update-subject-status.request.dto';
import { CopyAttendanceRequestDto } from '../../application/dtos/copy-attendance.request.dto';
import { CopyDailyAttendanceRequestDto } from '../../application/dtos/copy-daily-attendance.request.dto';
import { JustifyAttendanceRequestDto } from '../../application/dtos/justify-attendance.request.dto';
import {
	MarkDailySessionNotHeldRequestDto,
	UnmarkDailySessionNotHeldRequestDto,
} from '../../application/dtos/mark-daily-session-not-held.request.dto';
import { RegisterDailyAttendanceRequestDto } from '../../application/dtos/register-daily-attendance.request.dto';
import { RegisterSubjectAttendanceRequestDto } from '../../application/dtos/register-subject-attendance.request.dto';

@Controller('attendance')
@ApiTags('Attendance')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceCommandController {
	constructor(
		private readonly registerDailyAttendanceHandler: RegisterDailyAttendanceHandler,
		private readonly bulkRegisterAttendanceHandler: BulkRegisterAttendanceHandler,
		private readonly justifyAttendanceHandler: JustifyAttendanceHandler,
		private readonly bulkJustifyAttendanceHandler: BulkJustifyAttendanceHandler,
		private readonly bulkUpdateSubjectStatusHandler: BulkUpdateSubjectStatusHandler,
		private readonly registerSubjectAttendanceHandler: RegisterSubjectAttendanceHandler,
		private readonly copyAttendanceHandler: CopyAttendanceHandler,
		private readonly copyDailyAttendanceHandler: CopyDailyAttendanceHandler,
		private readonly markDailySessionNotHeldHandler: MarkDailySessionNotHeldHandler,
		private readonly unmarkDailySessionNotHeldHandler: UnmarkDailySessionNotHeldHandler,
	) {}

	@ApiOperation({
		summary: 'Registrar asistencia diaria de un curso',
		description: `Registra la asistencia de los estudiantes de un curso para la fecha indicada, creando o actualizando los registros existentes. Roles permitidos: preceptor, admin. Body de ejemplo:
{
  "courseId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "date": "2026-03-10",
  "records": [
    { "studentId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f", "status": "present" },
    { "studentId": "8f7e6d5c-4b3a-2c1d-0e9f-8a7b6c5d4e3f", "status": "absent" }
  ]
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Asistencia registrada correctamente. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Post('daily')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async registerDaily(
		@Body() dto: RegisterDailyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.registerDailyAttendanceHandler.execute(
			new RegisterDailyAttendanceCommand(
				user.tenantId,
				dto.courseId,
				new Date(dto.date),
				dto.records.map((r) => ({ studentId: r.studentId, status: r.status })),
				user.sub,
			),
		);
	}

	@ApiOperation({
		summary: 'Registrar asistencia masiva por defecto para un curso',
		description: `Registra en masa un mismo estado de asistencia para todos los estudiantes del curso en la fecha indicada, creando o actualizando los registros existentes. Roles permitidos: preceptor, admin. Body de ejemplo:
{
  "courseId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "date": "2026-03-10",
  "defaultStatus": "absent"
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Asistencia masiva registrada. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Post('daily/all')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async bulkRegister(
		@Body() dto: BulkRegisterAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.bulkRegisterAttendanceHandler.execute(
			new BulkRegisterAttendanceCommand(
				user.tenantId,
				dto.courseId,
				new Date(dto.date),
				dto.defaultStatus,
				user.sub,
			),
		);
	}

	@ApiOperation({
		summary: 'Justificar una inasistencia',
		description: `Justifica un registro de asistencia identificado por su id, cambiando su estado a justified y guardando el motivo. Roles permitidos: preceptor, admin. Body de ejemplo:
{
  "reason": "Certificado médico",
  "notes": "Presenta certificado emitido por el hospital"
}`,
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del registro de asistencia a justificar',
		example: '5c4d3e2f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
	})
	@ApiResponse({
		status: 201,
		description:
			'Justificación registrada. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Registro de asistencia no encontrado',
	})
	@Post(':id/justify')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async justify(
		@Param('id') id: string,
		@Body() dto: JustifyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.justifyAttendanceHandler.execute(
			new JustifyAttendanceCommand(
				id,
				dto.reason,
				user.sub,
				user.tenantId,
				dto.notes,
			),
		);
	}
	@ApiOperation({
		summary: 'Justificar varias inasistencias o tardanzas',
		description: `Justifica en una sola operación todos los registros de asistencia indicados (diarios o de materia) con el mismo motivo. Es todo o nada: si algún registro no se puede justificar no se guarda ninguno. Roles permitidos: preceptor, admin. Body de ejemplo:
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
			"Algún registro no se puede justificar. No se justificó ninguno y 'details' lista cada recordId con su motivo.",
	})
	@Post('justify/bulk')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async justifyBulk(
		@Body() dto: BulkJustifyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.bulkJustifyAttendanceHandler.execute(
			new BulkJustifyAttendanceCommand(
				user.tenantId,
				dto.recordIds,
				dto.reason,
				user.sub,
				dto.notes,
			),
		);
	}

	@ApiOperation({
		summary: 'Registrar asistencia de una materia',
		description: `Registra la asistencia de los estudiantes para una materia y fecha concretas, validando que el día corresponda al horario de la materia. Roles permitidos: teacher, admin. Body de ejemplo:
{
  "subjectId": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
  "courseId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "date": "2026-03-10",
  "records": [
    { "studentId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f", "status": "late" }
  ]
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Asistencia de la materia registrada. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({
		status: 400,
		description:
			'Validación falló o el día no corresponde al horario de la materia',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Post('subject')
	@RolesDecorator(ROLES.TEACHER, ROLES.ADMIN)
	async registerSubjectAttendance(
		@Body() dto: RegisterSubjectAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.registerSubjectAttendanceHandler.execute(
			new RegisterSubjectAttendanceCommand(
				user.tenantId,
				user.sub,
				user.role,
				dto.subjectId,
				dto.courseId,
				new Date(dto.date),
				dto.records,
			),
		);
	}

	@ApiOperation({
		summary: 'Actualizar en masa el estado de asistencia de una materia',
		description: `Aplica el mismo estado de asistencia a todos los estudiantes del curso de la materia para la fecha indicada. Roles permitidos: teacher, admin. Body de ejemplo:
{
  "subjectId": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
  "status": "absent",
  "date": "2026-03-10T13:00:00.000Z"
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Estados actualizados en masa. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({
		status: 400,
		description: 'Validación falló o materia no encontrada',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Post('subject/all')
	@RolesDecorator(ROLES.TEACHER, ROLES.ADMIN)
	async bulkUpdateSubjectStatus(
		@Body() dto: BulkUpdateSubjectStatusRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.bulkUpdateSubjectStatusHandler.execute(
			new BulkUpdateSubjectStatusCommand(
				user.sub,
				user.role,
				user.tenantId,
				dto.subjectId,
				new Date(dto.date),
				dto.status,
			),
		);
	}

	@ApiOperation({
		summary: 'Copiar la asistencia de una materia a otra fecha',
		description: `Copia los estados de asistencia de la última clase (o de sourceDate si se indica) de una materia hacia targetDate, sin sobrescribir los registros existentes. Roles permitidos: teacher, admin. Body de ejemplo:
{
  "subjectId": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
  "targetDate": "2026-03-17",
  "sourceDate": "2026-03-10"
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Asistencia copiada. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({
		status: 400,
		description: 'Validación falló o no hay registros en la fecha origen',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Post('subject/copy')
	@RolesDecorator(ROLES.TEACHER, ROLES.ADMIN)
	async copyAttendance(
		@Body() dto: CopyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.copyAttendanceHandler.execute(
			new CopyAttendanceCommand(
				user.sub,
				user.role,
				user.tenantId,
				dto.subjectId,
				new Date(dto.targetDate),
				dto.sourceDate ? new Date(dto.sourceDate) : undefined,
			),
		);
	}

	@ApiOperation({
		summary: 'Copiar la asistencia diaria de un curso a otra fecha',
		description: `Copia los estados de asistencia de la última fecha con registros (o de sourceDate si se indica) de un curso hacia targetDate, sin sobrescribir los registros existentes. Roles permitidos: preceptor, admin. Body de ejemplo:
{
  "courseId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "targetDate": "2026-03-17",
  "sourceDate": "2026-03-10"
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Asistencia copiada. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }. No devuelve cuerpo.',
	})
	@ApiResponse({
		status: 400,
		description: 'Validación falló o no hay registros en la fecha origen',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Post('daily/copy')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async copyDailyAttendance(
		@Body() dto: CopyDailyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.copyDailyAttendanceHandler.execute(
			new CopyDailyAttendanceCommand(
				user.sub,
				dto.courseId,
				new Date(dto.targetDate),
				dto.sourceDate ? new Date(dto.sourceDate) : undefined,
			),
		);
	}

	@ApiOperation({
		summary: 'Marcar la clase de teoría de un curso como no dictada',
		description: `Marca que el turno de teoría del curso no se dictó en la fecha indicada (por ejemplo, por ausencia del docente). Borra los registros de asistencia diaria ya cargados ese día y bloquea nuevos registros hasta desmarcar. Los registros de materias no se tocan. Es idempotente: si ya estaba marcado solo actualiza el motivo. Roles permitidos: preceptor, admin. Body de ejemplo:
{
  "courseId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "date": "2026-03-10",
  "reason": "Ausencia del docente"
}`,
	})
	@ApiResponse({
		status: 201,
		description:
			'Clase marcada como no dictada. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }; data es { deletedRecords: number }.',
	})
	@ApiResponse({
		status: 400,
		description:
			'Validación falló o el curso no tiene asistencia diaria (7mo técnico)',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	@Post('daily/not-held')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async markDailyNotHeld(
		@Body() dto: MarkDailySessionNotHeldRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.markDailySessionNotHeldHandler.execute(
			new MarkDailySessionNotHeldCommand(
				user.tenantId,
				dto.courseId,
				new Date(dto.date),
				dto.reason,
				user.sub,
			),
		);
	}

	@ApiOperation({
		summary: 'Quitar la marca de clase de teoría no dictada',
		description:
			'Quita la marca de no dictada del curso para la fecha indicada y reabre el registro de asistencia. Los registros borrados al marcar no se restauran. Es idempotente. Roles permitidos: preceptor, admin. URL de ejemplo: DELETE /attendance/daily/not-held?courseId=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d&date=2026-03-10. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiResponse({
		status: 200,
		description: 'Marca quitada. No devuelve cuerpo.',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	@Delete('daily/not-held')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async unmarkDailyNotHeld(
		@Query() dto: UnmarkDailySessionNotHeldRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.unmarkDailySessionNotHeldHandler.execute(
			new UnmarkDailySessionNotHeldCommand(
				user.tenantId,
				dto.courseId,
				new Date(dto.date),
			),
		);
	}
}
