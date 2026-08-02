import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ICoursePort } from '../../../domain/ports/course.port.interface';
import { IPdfGeneratorService } from '../../../domain/ports/pdf-generator.port.interface';
import { ITenantPort } from '../../../domain/ports/tenant.port.interface';
import { ExportFormatterService } from '../../../domain/services/export-formatter.service';
import { PdfMetadata } from '../../../domain/types/pdf-metadata.type';
import { ReportPeriod } from '../../../domain/value-objects/report-period.vo';
import { ReportGenerationService } from '../../services/report-generation.service';
import { ExportPdfCommand } from './export-pdf.command';

@Injectable()
export class ExportPdfHandler {
	constructor(
		private readonly reporter: ReportGenerationService,
		@Inject('IPdfGeneratorService')
		private readonly exporter: IPdfGeneratorService,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		@Inject('ITenantPort')
		private readonly tenantPort: ITenantPort,
	) {}

	async execute(command: ExportPdfCommand): Promise<Buffer> {
		const course = await this.coursePort.findById(command.courseId);
		if (!course) throw new NotFoundException('Course not found');
		const metadata = await this.buildMetadata(command, course.tenantId);
		if (command.type === 'student') {
			const studentId = command.studentId;
			if (!studentId) throw new BadRequestException('Student id required');
			return this.studentExecute(studentId, course.academicYearId, metadata);
		}
		const report = await this.reporter.generateMonthlyReport(
			command.courseId,
			ReportPeriod.generate(command.month, command.year),
		);
		const sections = ExportFormatterService.formatForPdf(report);
		return this.exporter.generate(sections, metadata);
	}

	private async studentExecute(
		studentId: string,
		academicYearId: string,
		metadata: PdfMetadata,
	): Promise<Buffer> {
		const report = await this.reporter.generateDetailedStudentReport(
			studentId,
			academicYearId,
		);
		const sections = ExportFormatterService.formatStudentForPdf(report);
		return this.exporter.generate(sections, metadata);
	}

	private async buildMetadata(
		command: ExportPdfCommand,
		tenantId: string,
	): Promise<PdfMetadata> {
		const tenant = await this.tenantPort.findById(tenantId);
		return {
			schoolName: tenant?.name ?? 'Sin nombre',
			periodLabel: `${command.month}/${command.year}`,
			generatedAt: new Date().toISOString(),
		};
	}
}
