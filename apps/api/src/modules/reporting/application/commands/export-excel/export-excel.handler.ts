import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { ICoursePort } from '../../../domain/ports/course.port.interface';
import { IExcelGeneratorService } from '../../../domain/ports/excel-generator.port.interface';
import { ExportFormatterService } from '../../../domain/services/export-formatter.service';
import { ReportPeriod } from '../../../domain/value-objects/report-period.vo';
import { ReportGenerationService } from '../../services/report-generation.service';
import { ExportExcelCommand } from './export-excel.command';
@Injectable()
export class ExportExcelHandler {
	constructor(
		private reporter: ReportGenerationService,
		@Inject('IExcelGeneratorService')
		private readonly generatorService: IExcelGeneratorService,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
	) {}
	async execute(command: ExportExcelCommand): Promise<Buffer> {
		const course = await this.coursePort.findById(command.courseId);
		if (!course) throw new NotFoundError('Curso no encontrado');
		if (command.type === 'student') {
			const studentId = command.studentId;
			if (!studentId)
				throw new DomainError(
					'Debe indicar el estudiante para generar el reporte individual',
				);
			return this.studentExecute(studentId, course.academicYearId);
		}
		const report = await this.reporter.generateMonthlyReport(
			command.courseId,
			ReportPeriod.generate(command.month, command.year),
		);
		const rows = ExportFormatterService.formatForExcel(report);
		return this.generatorService.generate(
			rows,
			`report-${new Date().toISOString()}-${course.name}`,
		);
	}
	private async studentExecute(
		studentId: string,
		academicYearId: string,
	): Promise<Buffer> {
		const report = await this.reporter.generateDetailedStudentReport(
			studentId,
			academicYearId,
		);
		const format = ExportFormatterService.formatStudentForExcel(report);
		return this.generatorService.generate(
			format,
			`report-${new Date().toISOString()}-${studentId}`,
		);
	}
}
