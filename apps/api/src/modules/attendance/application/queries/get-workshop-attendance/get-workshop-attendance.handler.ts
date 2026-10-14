import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../domain/repositories/workshop-attendance-record.repository.interface';
import {
	WorkshopAttendanceRecordResponseDto,
	WorkshopAttendanceResponseDto,
} from '../../dtos/workshop-attendance.response.dto';
import { assertCanManageWorkshopAttendance } from '../../services/workshop-attendance-access.policy';
import { GetWorkshopAttendanceQuery } from './get-workshop-attendance.query';

/**
 * Lists the ACTIVE students of a commission with their workshop status for a
 * date (null when attendance was not taken), in the order the port returns them.
 */
@Injectable()
export class GetWorkshopAttendanceQueryHandler {
	constructor(
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly attendanceRepo: IWorkshopAttendanceRecordRepository,
	) {}

	async execute(
		query: GetWorkshopAttendanceQuery,
	): Promise<WorkshopAttendanceResponseDto> {
		const commission = await this.commissionPort.findById(query.commissionId);
		if (!commission) throw new NotFoundException('Commission not found');
		assertCanManageWorkshopAttendance(commission, {
			userId: query.userId,
			role: query.role,
			tenantId: query.tenantId,
		});

		const students = await this.commissionPort.getActiveStudents(commission.id);
		const records = new Map(
			(
				await this.attendanceRepo.findByCommissionAndDate(commission.id, query.date)
			).map((record) => [record.studentId, record]),
		);

		return new WorkshopAttendanceResponseDto({
			commissionId: commission.id,
			commissionCode: commission.code,
			courseId: commission.courseId,
			courseName: commission.courseName,
			date: query.date,
			records: students.map((student) => {
				const record = records.get(student.id);
				return new WorkshopAttendanceRecordResponseDto({
					id: record?.id ?? null,
					studentId: student.id,
					studentName: student.name,
					status: record?.status ?? null,
					editedBy: record?.editedBy ?? null,
					editedAt: record?.editedAt ?? null,
				});
			}),
		});
	}
}
