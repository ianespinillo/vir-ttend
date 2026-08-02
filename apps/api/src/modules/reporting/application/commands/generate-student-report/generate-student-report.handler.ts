import { Injectable } from '@nestjs/common';
import { StudentReportResponseDto } from '../../dtos/student-report.response.dto';
import { ReportGenerationService } from '../../services/report-generation.service';
import { GenerateStudentReportCommand } from './generate-student-report.command';

@Injectable()
export class GenerateStudentReportHandler {
	constructor(private readonly reportService: ReportGenerationService) {}
	async execute(
		command: GenerateStudentReportCommand,
	): Promise<StudentReportResponseDto> {
		const reportData = await this.reportService.generateDetailedStudentReport(
			command.studentId,
			command.academicYearId,
		);
		return new StudentReportResponseDto(reportData);
	}
}
