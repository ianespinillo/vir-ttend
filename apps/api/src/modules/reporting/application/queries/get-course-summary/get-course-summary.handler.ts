import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { IReportRepository } from '../../../domain/repositories/report.repository.interface';
import { CourseSummaryResponseDto } from '../../dtos/course-summary.response.dto';
import { GetCourseSummaryQuery } from './get-course-summary.query';

@Injectable()
export class GetCourseSummaryQueryHandler {
	constructor(
		@Inject('IReportRepository')
		private readonly repo: IReportRepository,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
	) {}
	async execute(
		query: GetCourseSummaryQuery,
	): Promise<CourseSummaryResponseDto> {
		const year = await this.academicYearPort.findById(query.academicYearId);
		if (!year) throw new BadRequestException("Year doesn't exist");
		const reports = await this.repo.findByCourse(query.courseId);
		const filteredReports = reports.filter(
			(report) =>
				report.generatedAt >= year.startDate && report.generatedAt <= year.endDate,
		);
		return new CourseSummaryResponseDto({
			courseId: query.courseId,
			academicYearId: query.academicYearId,
			months: filteredReports.map((report) => ({
				year: report.year,
				month: report.month,
				averageAttendance: report.data.summary.averageAttendance,
			})),
		});
	}
}
