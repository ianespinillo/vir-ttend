import { BadRequestException, Inject } from '@nestjs/common';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IStudentPort } from '../../../domain/ports/student.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AlertsListResponseDto } from '../../dtos/alert-list.response.dto';
import { AlertResponseDto } from '../../dtos/alert.response.dto';
import { GetStudentAlertsQuery } from './get-student-alerts.query';

export class GetStudentAlertsQueryHandler {
	constructor(
		@Inject('IAttendanceAlertRepository')
		private readonly alertRepo: IAttendanceAlertRepository,
		@Inject('IAcademicYearPort')
		private readonly academicPort: IAcademicYearPort,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
	) {}
	async execute(query: GetStudentAlertsQuery): Promise<AlertsListResponseDto> {
		const year = await this.academicPort.findById(query.academicYearId);
		if (!year) throw new BadRequestException('No year found.');
		const records = await this.alertRepo.findByStudentAndDateRange(
			query.studentId,
			year.startDate,
			year.endDate,
		);

		const alertDtos = await Promise.all(
			records.map(async (alert) => {
				const [student, course] = await Promise.all([
					this.studentPort.findById(alert.studentId),
					this.coursePort.findById(alert.courseId),
				]);
				return new AlertResponseDto(alert, student?.name ?? '', course?.name ?? '');
			}),
		);

		return new AlertsListResponseDto(
			alertDtos,
			records.length,
			records.filter((r) => r.seenAt === null).length,
		);
	}
}
