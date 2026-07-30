import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { IAttendanceRecordPort } from '../../../domain/ports/attendance.port.interface';
import { StudentReportResponseDto } from '../../dtos/student-report.response.dto';
import { ReportGenerationService } from '../../services/report-generation.service';
import { GetStudentReportQuery } from './get-student-report.query';

@Injectable()
export class GetStudentReportQueryHandler {
	constructor(
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
		@Inject('IAttendanceRecordPort')
		private readonly attendanceRecordPort: IAttendanceRecordPort,
		private readonly reportService: ReportGenerationService,
	) {}
	async execute(
		query: GetStudentReportQuery,
	): Promise<StudentReportResponseDto> {
		const year = await this.academicYearPort.findById(query.academicYearId);
		if (!year)
			throw new InternalServerErrorException(
				'Academic Year not found, should be present',
			);
		const records = await this.attendanceRecordPort.findByStudentAndDateRange(
			query.studentId,
			year.startDate,
			year.endDate,
		);
		const report = await this.reportService.generateDetailedStudentReport(
			query.studentId,
			records,
		);
		return new StudentReportResponseDto(report);
	}
}
