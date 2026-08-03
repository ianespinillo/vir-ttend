import { Controller, Get, Param, Query } from '@nestjs/common';
import {
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { StudentReportResponseDto } from '../../application/dtos/student-report.response.dto';
import { GetStudentReportQueryHandler } from '../../application/queries/get-student-report/get-student-report.handler';
import { GetStudentReportQuery } from '../../application/queries/get-student-report/get-student-report.query';

@ApiTags('Reports')
@Controller('reports/student')
export class StudentReportsController {
	constructor(
		private readonly getStudentReportHandler: GetStudentReportQueryHandler,
	) {}

	@Get(':studentId')
	@ApiOperation({
		summary: 'Obtener reporte de asistencia de un estudiante',
		description:
			'Devuelve el detalle de asistencia mensual, los totales y las alertas de un estudiante durante un año académico. Rol: cualquier usuario autenticado. Ejemplo de URL: /reports/student/b7d2e4f1-8a3c-4d5e-9f6a-2c1b0d3e5f7a?academicYearId=a3c7e1f9-2b4d-4f5e-8a9c-1d0e2f3a4b5c',
	})
	@ApiParam({
		name: 'studentId',
		description: 'Identificador único del estudiante (UUID)',
		example: 'b7d2e4f1-8a3c-4d5e-9f6a-2c1b0d3e5f7a',
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
			'Reporte del estudiante. La API envuelve el resultado en { success: true, data: <DTO>, timeStamp: "ISO" }.',
		type: StudentReportResponseDto,
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
			'No se encontró el estudiante o el año académico. Error en { statusCode, timestamp, path, method, message, error }.',
	})
	async getStudentReport(
		@Param('studentId') studentId: string,
		@Query('academicYearId') academicYearId: string,
	): Promise<StudentReportResponseDto> {
		return this.getStudentReportHandler.execute(
			new GetStudentReportQuery(studentId, academicYearId),
		);
	}
}
