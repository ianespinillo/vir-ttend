import { Inject, Injectable } from '@nestjs/common';
import { IReportRepository } from '../../../domain/repositories/report.repository.interface';
import { ReportPeriod } from '../../../domain/value-objects/report-period.vo';
import { AvailableReportsResponseDto } from '../../dtos/available-reports.response.dto';
import { GetReportsByCourseQuery } from './get-reports-by-course.query';

@Injectable()
export class GetReportsByCourseQueryHandler {
	constructor(
		@Inject('IReportRepository')
		private readonly repo: IReportRepository,
	) {}
	async execute(
		query: GetReportsByCourseQuery,
	): Promise<AvailableReportsResponseDto> {
		const reports = await this.repo.findByCourse(query.courseId);
		return new AvailableReportsResponseDto(
			query.courseId,
			reports.map((r) => ReportPeriod.generate(r.month, r.year)),
		);
	}
}
