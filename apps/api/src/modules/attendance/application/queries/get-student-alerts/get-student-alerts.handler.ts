import { BadRequestException } from '@nestjs/common';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AlertsListResponseDto } from '../../dtos/alert-list.response.dto';
import { GetStudentAlertsQuery } from './get-student-alerts.query';

export class GetStudentAlertsQueryHandler {
	constructor(
		private readonly alertRepo: IAttendanceAlertRepository,
		private readonly academicPort: IAcademicYearPort,
	) {}
	async execute(query: GetStudentAlertsQuery): Promise<AlertsListResponseDto> {
		const year = await this.academicPort.findById(query.academicYearId);
		if (!year) throw new BadRequestException('No year found.');
		const records = await this.alertRepo.findByStudentAndDateRange(
			query.studentId,
			year.startDate,
			year.endDate,
		);
		return new AlertsListResponseDto(
			records,
			records.length,
			records.filter((r) => r.seenAt === null).length,
		);
	}
}
