import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MonthlyReport } from '../../../domain/entities/monthly-report.entity';
import { ICoursePort } from '../../../domain/ports/course.port.interface';
import { IReportRepository } from '../../../domain/repositories/report.repository.interface';
import { ReportPeriod } from '../../../domain/value-objects/report-period.vo';
import { MonthlyReportResponseDto } from '../../dtos/monthly-report.response.dto';
import { ReportGenerationService } from '../../services/report-generation.service';
import { GenerateMonthlyReportCommand } from './generate-monthly-report.command';

@Injectable()
export class GenerateMonthlyReportHandler {
	constructor(
		private readonly reportService: ReportGenerationService,
		@Inject('IReportRepository')
		private readonly reportRepo: IReportRepository,
		@Inject('ICoursePort')
		private readonly courseRepo: ICoursePort,
	) {}
	async execute(
		command: GenerateMonthlyReportCommand,
	): Promise<MonthlyReportResponseDto> {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course)
			throw new NotFoundException(`Course ${command.courseId} not found`);
		const reportPeriod = ReportPeriod.generate(command.month, command.year);
		const existingReport = await this.reportRepo.findByCourseAndPeriod(
			command.courseId,
			reportPeriod,
		);
		if (existingReport) return this.updateReport(existingReport, reportPeriod);
		return this.generateNew(command, course.tenantId, course.academicYearId);
	}
	private async generateNew(
		command: GenerateMonthlyReportCommand,
		tenantId: string,
		academicYearId: string,
	): Promise<MonthlyReportResponseDto> {
		const period = ReportPeriod.generate(command.month, command.year);
		const reportData = await this.reportService.generateMonthlyReport(
			command.courseId,
			period,
		);
		const newReport = MonthlyReport.create({
			courseId: command.courseId,
			month: period.month,
			year: period.year,
			academicYearId,
			tenantId,
			data: reportData,
			generatedAt: new Date(),
		});
		await this.reportRepo.save(newReport);
		return new MonthlyReportResponseDto(newReport);
	}
	private async updateReport(
		report: MonthlyReport,
		period: ReportPeriod,
	): Promise<MonthlyReportResponseDto> {
		const updatedReport = await this.reportService.generateMonthlyReport(
			report.courseId,
			period,
		);
		report.data.modify(updatedReport);
		await this.reportRepo.save(report);
		return new MonthlyReportResponseDto(report);
	}
}
