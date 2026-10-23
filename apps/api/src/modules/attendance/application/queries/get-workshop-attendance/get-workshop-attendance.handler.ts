import { Inject, Injectable } from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { NotFoundError } from '../../../../../common/errors';
import { WorkshopJustification } from '../../../domain/entities/workshop-justification.entity';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../domain/repositories/workshop-attendance-record.repository.interface';
import { IWorkshopJustificationRepository } from '../../../domain/repositories/workshop-justification.repository.interface';
import { JustificationResponseDto } from '../../dtos/justification.response.dto';
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
		@Inject('IWorkshopJustificationRepository')
		private readonly justificationRepo: IWorkshopJustificationRepository,
	) {}

	async execute(
		query: GetWorkshopAttendanceQuery,
	): Promise<WorkshopAttendanceResponseDto> {
		const commission = await this.commissionPort.findById(query.commissionId);
		if (!commission) throw new NotFoundError('Comisión no encontrada');
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

		// One query for the whole roster instead of one per justified record.
		const justifiedIds = [...records.values()]
			.filter((record) => record.status === ATTENDANCE_STATUS.JUSTIFIED)
			.map((record) => record.id);
		const justifications = new Map(
			(await this.justificationRepo.findByRecords(justifiedIds)).map((j) => [
				j.workshopAttendanceRecordId.getRaw(),
				j,
			]),
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
					justification: record
						? toJustificationDto(justifications.get(record.id))
						: undefined,
				});
			}),
		});
	}
}

function toJustificationDto(
	justification: WorkshopJustification | undefined,
): JustificationResponseDto | undefined {
	return justification ? new JustificationResponseDto(justification) : undefined;
}
