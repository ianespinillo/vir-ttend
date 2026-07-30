import { Controller, Get, Param, Query } from '@nestjs/common';
import { StudentReportResponseDto } from '../../application/dtos/student-report.response.dto';
import { GetStudentReportQueryHandler } from '../../application/queries/get-student-report/get-student-report.handler';
import { GetStudentReportQuery } from '../../application/queries/get-student-report/get-student-report.query';

@Controller('reports/student')
export class StudentReportsController {
	constructor(
		private readonly getStudentReportHandler: GetStudentReportQueryHandler,
	) {}

	@Get(':studentId')
	async getStudentReport(
		@Param('studentId') studentId: string,
		@Query('academicYearId') academicYearId: string,
	): Promise<StudentReportResponseDto> {
		return this.getStudentReportHandler.execute(
			new GetStudentReportQuery(studentId, academicYearId),
		);
	}
}
