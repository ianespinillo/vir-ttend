import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ROLES } from '@repo/common';
// attendance-query.controller.ts
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { AttendanceMetricsResponseDto } from '../../application/dtos/attendance-metrics.response.dto';
import { AttendanceRecordResponseDto } from '../../application/dtos/attendance-record.response.dto';
import { SubjectAttendanceResponseDto } from '../../application/dtos/subject-attendance.response.dto';
import { SubjectHistoryResponseDto } from '../../application/dtos/subject-history.response.dto';
import { GetAttendanceByStudentQueryHandler } from '../../application/queries/get-attendance-by-student/get-attendance-by-student.handler';
import { GetAttendanceByStudentQuery } from '../../application/queries/get-attendance-by-student/get-attendance-by-student.query';
import { GetAttendanceHistoryQueryHandler } from '../../application/queries/get-attendance-history/get-attendance-history.handler';
import { GetAttendanceHistoryQuery } from '../../application/queries/get-attendance-history/get-attendance-history.query';
import { GetAttendanceMetricsQueryHandler } from '../../application/queries/get-attendance-metrics/get-attendance-metrics.handler';
import { GetAttendanceMetricsQuery } from '../../application/queries/get-attendance-metrics/get-attendance-metrics.query';
import { GetDailyAttendanceQueryHandler } from '../../application/queries/get-daily-attendance/get-daily-attendance.handler';
import { GetDailyAttendanceQuery } from '../../application/queries/get-daily-attendance/get-daily-attendance.query';
import { GetSubjectAttendanceQueryHandler } from '../../application/queries/get-subject-attendance/get-subject-attendance.handler';
import { GetSubjectAttendanceQuery } from '../../application/queries/get-subject-attendance/get-subject-attendance.query';
import { GetSubjectHistoryQueryHandler } from '../../application/queries/get-subject-history/get-subject-history.handler';
import { GetSubjectHistoryQuery } from '../../application/queries/get-subject-history/get-subject-history.query';

@Controller('attendance')
@ApiTags('Attendance')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceQueryController {
	constructor(
		private readonly getDailyAttendanceHandler: GetDailyAttendanceQueryHandler,
		private readonly getAttendanceMetricsHandler: GetAttendanceMetricsQueryHandler,
		private readonly getAttendanceByStudentHandler: GetAttendanceByStudentQueryHandler,
		private readonly getAttendanceHistoryHandler: GetAttendanceHistoryQueryHandler,
		private readonly getSubjectHistoryHandler: GetSubjectHistoryQueryHandler,
		private readonly getSubjectAttendanceHandler: GetSubjectAttendanceQueryHandler,
	) {}

	@ApiOperation({
		summary: 'Obtener la asistencia diaria de un curso',
		description:
			'Devuelve los registros de asistencia de todos los estudiantes de un curso para la fecha indicada. Los estudiantes sin registrar aparecen con estado vacío. Roles permitidos: preceptor, admin. URL de ejemplo: GET /attendance/daily?courseId=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d&date=2026-03-10. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'courseId',
		required: true,
		description: 'Identificador del curso',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
		type: String,
	})
	@ApiQuery({
		name: 'date',
		required: true,
		description: 'Fecha de la asistencia (YYYY-MM-DD)',
		example: '2026-03-10',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de registros de asistencia del curso',
		type: [AttendanceRecordResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get('daily')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getDaily(
		@Query('courseId') courseId: string,
		@Query('date') date: string,
	) {
		return this.getDailyAttendanceHandler.execute(
			new GetDailyAttendanceQuery(courseId, new Date(date)),
		);
	}

	@ApiOperation({
		summary: 'Obtener las métricas de asistencia de un curso',
		description:
			'Calcula y devuelve las métricas de asistencia (presentes, ausentes, tardes, justificados, etc.) de un curso para una fecha. Roles permitidos: preceptor, admin. URL de ejemplo: GET /attendance/metrics?courseId=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d&date=2026-03-10. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'courseId',
		required: true,
		description: 'Identificador del curso',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
		type: String,
	})
	@ApiQuery({
		name: 'date',
		required: true,
		description: 'Fecha de la asistencia (YYYY-MM-DD)',
		example: '2026-03-10',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: 'Métricas de asistencia del curso',
		type: AttendanceMetricsResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get('metrics')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getMetrics(
		@Query('courseId') courseId: string,
		@Query('date') date: string,
	) {
		return this.getAttendanceMetricsHandler.execute(
			new GetAttendanceMetricsQuery(courseId, new Date(date)),
		);
	}

	@ApiOperation({
		summary: 'Obtener la asistencia de un estudiante en un período',
		description:
			'Devuelve los registros de asistencia de un estudiante entre dos fechas. Roles permitidos: preceptor, admin. URL de ejemplo: GET /attendance/student/1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f?from=2026-03-01&to=2026-03-31. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiParam({
		name: 'studentId',
		description: 'Identificador del estudiante',
		example: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
	})
	@ApiQuery({
		name: 'from',
		required: true,
		description: 'Fecha inicial del período (YYYY-MM-DD)',
		example: '2026-03-01',
		type: String,
	})
	@ApiQuery({
		name: 'to',
		required: true,
		description: 'Fecha final del período (YYYY-MM-DD)',
		example: '2026-03-31',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: 'Registros de asistencia del estudiante en el período',
		type: [AttendanceRecordResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get('student/:studentId')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getByStudent(
		@Param('studentId') studentId: string,
		@Query('from') from: string,
		@Query('to') to: string,
	) {
		return this.getAttendanceByStudentHandler.execute(
			new GetAttendanceByStudentQuery(studentId, new Date(from), new Date(to)),
		);
	}

	@ApiOperation({
		summary: 'Obtener el historial de asistencia de un curso',
		description:
			'Devuelve todos los registros de asistencia de un curso entre dos fechas. Roles permitidos: preceptor, admin. URL de ejemplo: GET /attendance/history?courseId=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d&from=2026-03-01&to=2026-03-31. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'courseId',
		required: true,
		description: 'Identificador del curso',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
		type: String,
	})
	@ApiQuery({
		name: 'from',
		required: true,
		description: 'Fecha inicial del período (YYYY-MM-DD)',
		example: '2026-03-01',
		type: String,
	})
	@ApiQuery({
		name: 'to',
		required: true,
		description: 'Fecha final del período (YYYY-MM-DD)',
		example: '2026-03-31',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: 'Historial de registros de asistencia del curso',
		type: [AttendanceRecordResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get('history')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getHistory(
		@Query('courseId') courseId: string,
		@Query('from') from: string,
		@Query('to') to: string,
	) {
		return this.getAttendanceHistoryHandler.execute(
			new GetAttendanceHistoryQuery(courseId, new Date(from), new Date(to)),
		);
	}

	@ApiOperation({
		summary: 'Obtener la asistencia de una materia en una fecha',
		description:
			'Devuelve los registros de asistencia de una materia para una fecha, junto con las métricas calculadas de la clase. Roles permitidos: teacher, preceptor, admin. URL de ejemplo: GET /attendance/subject?subjectId=7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f&date=2026-03-10. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'subjectId',
		required: true,
		description: 'Identificador de la materia',
		example: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
		type: String,
	})
	@ApiQuery({
		name: 'date',
		required: true,
		description: 'Fecha de la clase (YYYY-MM-DD)',
		example: '2026-03-10',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: 'Asistencia de la materia con sus métricas',
		type: SubjectAttendanceResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: 'Validación falló o identificador de materia inválido',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@Get('subject')
	@RolesDecorator(ROLES.TEACHER, ROLES.PRECEPTOR, ROLES.ADMIN)
	async getSubjectAttendance(
		@Query('subjectId') subjectId: string,
		@Query('date') date: string,
	) {
		return this.getSubjectAttendanceHandler.execute(
			new GetSubjectAttendanceQuery(subjectId, new Date(date)),
		);
	}

	@ApiOperation({
		summary: 'Obtener el historial de asistencia de una materia',
		description:
			'Devuelve el historial completo de una materia entre dos fechas: sesiones por clase, registros por estudiante y porcentajes de ausencia. Roles permitidos: teacher, preceptor, admin. URL de ejemplo: GET /attendance/subject/7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f/history?from=2026-03-01&to=2026-03-31. Las respuestas exitosas se envuelven en { success: true, data, timeStamp }.',
	})
	@ApiParam({
		name: 'subjectId',
		description: 'Identificador de la materia',
		example: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
	})
	@ApiQuery({
		name: 'from',
		required: true,
		description: 'Fecha inicial del período (YYYY-MM-DD)',
		example: '2026-03-01',
		type: String,
	})
	@ApiQuery({
		name: 'to',
		required: true,
		description: 'Fecha final del período (YYYY-MM-DD)',
		example: '2026-03-31',
		type: String,
	})
	@ApiResponse({
		status: 200,
		description: 'Historial de asistencia de la materia',
		type: SubjectHistoryResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Materia no encontrada',
	})
	@Get('subject/:subjectId/history')
	@RolesDecorator(ROLES.TEACHER, ROLES.PRECEPTOR, ROLES.ADMIN)
	async getSubjectHistory(
		@Param('subjectId') subjectId: string,
		@Query('from') from: string,
		@Query('to') to: string,
	) {
		return this.getSubjectHistoryHandler.execute(
			new GetSubjectHistoryQuery(subjectId, new Date(from), new Date(to)),
		);
	}
}
