import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { GenerateMonthlyReportCommand } from '../../application/commands/generate-monthly-report/generate-monthly-report.command';
import { GenerateMonthlyReportHandler } from '../../application/commands/generate-monthly-report/generate-monthly-report.handler';
import { AvailableReportsResponseDto } from '../../application/dtos/available-reports.response.dto';
import { CourseSummaryResponseDto } from '../../application/dtos/course-summary.response.dto';
import { GenerateReportRequestDto } from '../../application/dtos/generate-report.request.dto';
import { MonthlyReportResponseDto } from '../../application/dtos/monthly-report.response.dto';
import { GetCourseSummaryQueryHandler } from '../../application/queries/get-course-summary/get-course-summary.handler';
import { GetCourseSummaryQuery } from '../../application/queries/get-course-summary/get-course-summary.query';
import { GetMonthlyReportQueryHandler } from '../../application/queries/get-monthly-report/get-monthly-report.handler';
import { GetMonthlyReportQuery } from '../../application/queries/get-monthly-report/get-monthly-report.query';
import { GetReportsByCourseQueryHandler } from '../../application/queries/get-reports-by-course/get-reports-by-course.handler';
import { GetReportsByCourseQuery } from '../../application/queries/get-reports-by-course/get-reports-by-course.query';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
	constructor(
		private readonly getMonthlyReportHandler: GetMonthlyReportQueryHandler,
		private readonly generateMonthlyReportHandler: GenerateMonthlyReportHandler,
		private readonly getCourseSummaryHandler: GetCourseSummaryQueryHandler,
		private readonly getReportsByCourseHandler: GetReportsByCourseQueryHandler,
	) {}

	@Get('monthly')
	@ApiOperation({
		summary: 'Obtener reporte mensual de un curso',
		description:
			'Devuelve el reporte mensual de asistencia de un curso para un mes y año determinados. Rol: cualquier usuario autenticado. Ejemplo de URL: /reports/monthly?courseId=6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44&month=7&year=2026',
	})
	@ApiQuery({
		name: 'courseId',
		required: true,
		type: String,
		description: 'Identificador único del curso (UUID)',
		example: '6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44',
	})
	@ApiQuery({
		name: 'month',
		required: true,
		type: Number,
		description: 'Mes del reporte (1-12)',
		example: 7,
	})
	@ApiQuery({
		name: 'year',
		required: true,
		type: Number,
		description: 'Año del reporte',
		example: 2026,
	})
	@ApiResponse({
		status: 200,
		description:
			'Reporte mensual del curso. La API envuelve el resultado en { success: true, data: <DTO>, timeStamp: "ISO" }.',
		type: MonthlyReportResponseDto,
	})
	@ApiResponse({
		status: 400,
		description:
			'Parámetros de consulta inválidos. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 401,
		description:
			'No autenticado: falta la cookie access_token. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 403,
		description:
			'Sin permisos para acceder al recurso. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 404,
		description:
			'No se encontró el curso o el reporte del período. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	async getMonthly(
		@Query('courseId') courseId: string,
		@Query('month') month: number,
		@Query('year') year: number,
	): Promise<MonthlyReportResponseDto> {
		return this.getMonthlyReportHandler.execute(
			new GetMonthlyReportQuery(courseId, month, year),
		);
	}

	@Post('generate')
	@ApiOperation({
		summary: 'Generar reporte mensual de un curso',
		description:
			'Genera y persiste el reporte mensual de asistencia de un curso para un mes y año determinados. Rol: cualquier usuario autenticado. Ejemplo de body: {"courseId": "6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44", "month": 7, "year": 2026}',
	})
	@ApiResponse({
		status: 201,
		description:
			'Reporte mensual generado. La API envuelve el resultado en { success: true, data: <DTO>, timeStamp: "ISO" }.',
		type: MonthlyReportResponseDto,
	})
	@ApiResponse({
		status: 400,
		description:
			'Body inválido. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 401,
		description:
			'No autenticado: falta la cookie access_token. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 403,
		description:
			'Sin permisos para acceder al recurso. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 404,
		description:
			'No se encontró el curso. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	async generate(
		@Body() dto: GenerateReportRequestDto,
	): Promise<MonthlyReportResponseDto> {
		return this.generateMonthlyReportHandler.execute(
			new GenerateMonthlyReportCommand(dto.courseId, dto.year, dto.month),
		);
	}

	@Get('course/:courseId/summary')
	@ApiOperation({
		summary: 'Obtener resumen de asistencia de un curso',
		description:
			'Devuelve el promedio de asistencia mensual de un curso a lo largo de un año académico. Rol: cualquier usuario autenticado. Ejemplo de URL: /reports/course/6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44/summary?academicYearId=a3c7e1f9-2b4d-4f5e-8a9c-1d0e2f3a4b5c',
	})
	@ApiParam({
		name: 'courseId',
		description: 'Identificador único del curso (UUID)',
		example: '6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44',
	})
	@ApiQuery({
		name: 'academicYearId',
		required: true,
		type: String,
		description: 'Identificador del año académico (UUID)',
		example: 'a3c7e1f9-2b4d-4f5e-8a9c-1d0e2f3a4b5c',
	})
	@ApiResponse({
		status: 200,
		description:
			'Resumen de asistencia del curso. La API envuelve el resultado en { success: true, data: <DTO>, timeStamp: "ISO" }.',
		type: CourseSummaryResponseDto,
	})
	@ApiResponse({
		status: 400,
		description:
			'Parámetros de consulta inválidos. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 401,
		description:
			'No autenticado: falta la cookie access_token. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 403,
		description:
			'Sin permisos para acceder al recurso. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 404,
		description:
			'No se encontró el curso o el año académico. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	async getCourseSummary(
		@Param('courseId') courseId: string,
		@Query('academicYearId') academicYearId: string,
	): Promise<CourseSummaryResponseDto> {
		return this.getCourseSummaryHandler.execute(
			new GetCourseSummaryQuery(courseId, academicYearId),
		);
	}

	@Get('course/:courseId/available')
	@ApiOperation({
		summary: 'Listar reportes disponibles de un curso',
		description:
			'Devuelve los períodos (mes y año) que ya tienen reporte mensual generado para un curso. Rol: cualquier usuario autenticado. Ejemplo de URL: /reports/course/6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44/available',
	})
	@ApiParam({
		name: 'courseId',
		description: 'Identificador único del curso (UUID)',
		example: '6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44',
	})
	@ApiResponse({
		status: 200,
		description:
			'Reportes disponibles del curso. La API envuelve el resultado en { success: true, data: <DTO>, timeStamp: "ISO" }.',
		type: AvailableReportsResponseDto,
	})
	@ApiResponse({
		status: 401,
		description:
			'No autenticado: falta la cookie access_token. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 403,
		description:
			'Sin permisos para acceder al recurso. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 404,
		description:
			'No se encontró el curso. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	async getAvailableReports(
		@Param('courseId') courseId: string,
	): Promise<AvailableReportsResponseDto> {
		return this.getReportsByCourseHandler.execute(
			new GetReportsByCourseQuery(courseId),
		);
	}
}
