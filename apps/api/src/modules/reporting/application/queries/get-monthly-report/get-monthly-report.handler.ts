import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MonthlyReport } from '../../../domain/entities/monthly-report.entity';
import { ICoursePort } from '../../../domain/ports/course.port.interface';
import { IReportRepository } from '../../../domain/repositories/report.repository.interface';
import { ReportPeriod } from '../../../domain/value-objects/report-period.vo';
import { MonthlyReportResponseDto } from '../../dtos/monthly-report.response.dto';
import { ReportGenerationService } from '../../services/report-generation.service';
import { GetMonthlyReportQuery } from './get-monthly-report.query';

@Injectable()
export class GetMonthlyReportQueryHandler {
	constructor(
		@Inject('IReportRepository')
		private readonly repo: IReportRepository,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		private readonly reportService: ReportGenerationService,
	) {}
	async execute(
		query: GetMonthlyReportQuery,
	): Promise<MonthlyReportResponseDto> {
		const course = await this.coursePort.findById(query.courseId);
		if (!course) throw new NotFoundException('Course not found');
		const period = ReportPeriod.generate(query.month, query.year);
		const existing = await this.repo.findByCourseAndPeriod(
			query.courseId,
			period,
		);
		if (existing) return new MonthlyReportResponseDto(existing);
		const reportData = await this.reportService.generateMonthlyReport(
			query.courseId,
			period,
		);
		const newReport = MonthlyReport.create({
			courseId: query.courseId,
			month: period.month,
			year: period.year,
			academicYearId: course.academicYearId,
			tenantId: course.tenantId,
			data: reportData,
			generatedAt: new Date(),
		});
		await this.repo.save(newReport);
		return new MonthlyReportResponseDto(newReport);
	}
}
