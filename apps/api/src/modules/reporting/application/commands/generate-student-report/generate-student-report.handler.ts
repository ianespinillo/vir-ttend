import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { IAttendanceRecordPort } from '../../../domain/ports/attendance.port.interface';
import { StudentReportResponseDto } from '../../dtos/student-report.response.dto';
import { ReportGenerationService } from '../../services/report-generation.service';
import { GenerateStudentReportCommand } from './generate-student-report.command';

@Injectable()
export class GenerateStudentReportHandler {
	constructor(
		@Inject('IAttendanceRecordPort')
		private readonly attendancePort: IAttendanceRecordPort,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
		private readonly reportService: ReportGenerationService,
	) {}
	async execute(
		command: GenerateStudentReportCommand,
	): Promise<StudentReportResponseDto> {
		const year = await this.academicYearPort.findById(command.academicYearId);
		if (!year) throw new InternalServerErrorException('Academic Year not found');
		const records = await this.attendancePort.findByStudentAndDateRange(
			command.studentId,
			year.startDate,
			year.endDate,
		);
		const reportData = await this.reportService.generateDetailedStudentReport(
			command.studentId,
			records,
		);
		return new StudentReportResponseDto(reportData);
	}
}
