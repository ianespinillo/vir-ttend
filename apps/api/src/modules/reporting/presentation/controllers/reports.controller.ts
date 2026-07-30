import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

@Controller('reports')
export class ReportsController {
	constructor(
		private readonly getMonthlyReportHandler: GetMonthlyReportQueryHandler,
		private readonly generateMonthlyReportHandler: GenerateMonthlyReportHandler,
		private readonly getCourseSummaryHandler: GetCourseSummaryQueryHandler,
		private readonly getReportsByCourseHandler: GetReportsByCourseQueryHandler,
	) {}

	@Get('monthly')
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
	async generate(
		@Body() dto: GenerateReportRequestDto,
	): Promise<MonthlyReportResponseDto> {
		return this.generateMonthlyReportHandler.execute(
			new GenerateMonthlyReportCommand(dto.courseId, dto.year, dto.month),
		);
	}

	@Get('course/:courseId/summary')
	async getCourseSummary(
		@Param('courseId') courseId: string,
		@Query('academicYearId') academicYearId: string,
	): Promise<CourseSummaryResponseDto> {
		return this.getCourseSummaryHandler.execute(
			new GetCourseSummaryQuery(courseId, academicYearId),
		);
	}

	@Get('course/:courseId/available')
	async getAvailableReports(
		@Param('courseId') courseId: string,
	): Promise<AvailableReportsResponseDto> {
		return this.getReportsByCourseHandler.execute(
			new GetReportsByCourseQuery(courseId),
		);
	}
}
