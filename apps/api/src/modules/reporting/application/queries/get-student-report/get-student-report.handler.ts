import { Injectable } from '@nestjs/common';
import { StudentReportResponseDto } from '../../dtos/student-report.response.dto';
import { ReportGenerationService } from '../../services/report-generation.service';
import { GetStudentReportQuery } from './get-student-report.query';

@Injectable()
export class GetStudentReportQueryHandler {
	constructor(private readonly reportService: ReportGenerationService) {}
	async execute(
		query: GetStudentReportQuery,
	): Promise<StudentReportResponseDto> {
		const report = await this.reportService.generateDetailedStudentReport(
			query.studentId,
			query.academicYearId,
		);
		return new StudentReportResponseDto(report);
	}
}
