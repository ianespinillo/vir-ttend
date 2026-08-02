import { Body, Controller, Inject, Post, Res, UseGuards } from '@nestjs/common';
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
