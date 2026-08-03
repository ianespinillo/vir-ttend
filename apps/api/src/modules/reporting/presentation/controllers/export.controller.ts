import { Body, Controller, Inject, Post, Res, UseGuards } from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiProduces,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ROLES } from '@repo/common';
import { Response } from 'express';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { ExportExcelCommand } from '../../application/commands/export-excel/export-excel.command';
import { ExportExcelHandler } from '../../application/commands/export-excel/export-excel.handler';
import { ExportPdfCommand } from '../../application/commands/export-pdf/export-pdf.command';
import { ExportPdfHandler } from '../../application/commands/export-pdf/export-pdf.handler';
import { ExportExcelRequestDto } from '../../application/dtos/export-excel.request.dto';
import { ExportPdfRequestDto } from '../../application/dtos/export-pdf.request.dto';
import { ICoursePort } from '../../domain/ports/course.port.interface';

const EXCEL_CONTENT_TYPE =
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre',
];

@ApiTags('Export')
@ApiCookieAuth('access_token')
@Controller('reports/export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
	constructor(
		private readonly exportExcelHandler: ExportExcelHandler,
		private readonly exportPdfHandler: ExportPdfHandler,
		@Inject('ICoursePort') private readonly coursePort: ICoursePort,
	) {}

	@Post('excel')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	@ApiOperation({
		summary: 'Exportar reporte a Excel',
		description:
			'Genera un archivo Excel (.xlsx) con el reporte mensual del curso o el reporte de un estudiante y lo devuelve como stream binario. Roles: PRECEPTOR, ADMIN. Ejemplo de body: {"courseId": "6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44", "month": 7, "year": 2026, "type": "monthly"}',
	})
	@ApiProduces(
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	)
	@ApiResponse({
		status: 200,
		description: 'Archivo Excel generado',
		content: {
			'application/octet-stream': {
				schema: { type: 'string', format: 'binary' },
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Body inválido.',
	})
	@ApiResponse({
		status: 401,
		description: 'No autenticado: falta la cookie access_token.',
	})
	@ApiResponse({
		status: 403,
		description: 'Sin permisos: se requiere rol PRECEPTOR o ADMIN.',
	})
	@ApiResponse({
		status: 404,
		description: 'No se encontró el curso o el estudiante.',
	})
	async exportExcel(
		@Body() dto: ExportExcelRequestDto,
		@Res() res: Response,
	): Promise<void> {
		const buffer = await this.exportExcelHandler.execute(
			new ExportExcelCommand(
				dto.courseId,
				dto.month,
				dto.year,
				dto.type,
				dto.studentId,
			),
		);
		const filename = await this.buildFilename(
			dto.courseId,
			dto.month,
			dto.year,
			'xlsx',
		);
		res.setHeader('Content-Type', EXCEL_CONTENT_TYPE);
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.send(buffer);
	}

	@Post('pdf')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	@ApiOperation({
		summary: 'Exportar reporte a PDF',
		description:
			'Genera un archivo PDF con el reporte mensual del curso o el reporte de un estudiante y lo devuelve como stream binario. Roles: PRECEPTOR, ADMIN. Ejemplo de body: {"courseId": "6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44", "month": 7, "year": 2026, "type": "student", "studentId": "b7d2e4f1-8a3c-4d5e-9f6a-2c1b0d3e5f7a"}',
	})
	@ApiProduces('application/pdf')
	@ApiResponse({
		status: 200,
		description: 'Archivo PDF generado',
		content: {
			'application/octet-stream': {
				schema: { type: 'string', format: 'binary' },
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Body inválido.',
	})
	@ApiResponse({
		status: 401,
		description: 'No autenticado: falta la cookie access_token.',
	})
	@ApiResponse({
		status: 403,
		description: 'Sin permisos: se requiere rol PRECEPTOR o ADMIN.',
	})
	@ApiResponse({
		status: 404,
		description: 'No se encontró el curso o el estudiante.',
	})
	async exportPdf(
		@Body() dto: ExportPdfRequestDto,
		@Res() res: Response,
	): Promise<void> {
		const buffer = await this.exportPdfHandler.execute(
			new ExportPdfCommand(
				dto.courseId,
				dto.month,
				dto.year,
				dto.type,
				dto.studentId,
			),
		);
		const filename = await this.buildFilename(
			dto.courseId,
			dto.month,
			dto.year,
			'pdf',
		);
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.send(buffer);
	}

	private async buildFilename(
		courseId: string,
		month: number,
		year: number,
		extension: 'xlsx' | 'pdf',
	): Promise<string> {
		const course = await this.coursePort.findById(courseId);
		const courseSlug =
			(course?.name ?? 'curso')
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '') || 'curso';
		return `asistencia-${courseSlug}-${MONTHS[month - 1]}-${year}.${extension}`;
	}
}
