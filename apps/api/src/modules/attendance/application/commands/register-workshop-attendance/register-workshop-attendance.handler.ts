import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceStatus } from '@repo/common';
import { WorkshopAttendanceRecord } from '../../../domain/entities/workshop-attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../domain/events/attendance-registered.event';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../domain/repositories/workshop-attendance-record.repository.interface';
import { assertCanManageWorkshopAttendance } from '../../services/workshop-attendance-access.policy';
import { RegisterWorkshopAttendanceCommand } from './register-workshop-attendance.command';

/**
 * Upserts the workshop attendance of a commission for a date. Only the
 * commission's ACTIVE students can be recorded. Idempotent: unchanged records
 * are not saved. Announces each created or changed record so the student's
 * absence alerts are re-evaluated once the transaction committed.
 */
@Injectable()
export class RegisterWorkshopAttendanceHandler {
	constructor(
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly attendanceRepo: IWorkshopAttendanceRecordRepository,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
		private readonly em: EventEmitter2,
	) {}

	async execute(command: RegisterWorkshopAttendanceCommand): Promise<void> {
		const commission = await this.commissionPort.findById(command.commissionId);
		if (!commission) throw new NotFoundException('Commission not found');
		assertCanManageWorkshopAttendance(commission, {
			userId: command.userId,
			role: command.role,
			tenantId: command.tenantId,
		});

		const activeIds = new Set(
			(await this.commissionPort.getActiveStudents(commission.id)).map(
				(student) => student.id,
			),
		);
		const outsiders = [
			...new Set(
				command.records
					.map((record) => record.studentId)
					.filter((id) => !activeIds.has(id)),
			),
		];
		if (outsiders.length > 0) {
			throw new BadRequestException(
				`Students not in commission ${commission.code}: ${outsiders.join(', ')}`,
			);
		}

		const changedRecords = await this.unitOfWork.run(async () => {
			const existingByStudent = new Map(
				(
					await this.attendanceRepo.findByCommissionAndDate(
						commission.id,
						command.date,
					)
				).map((record) => [record.studentId, record]),
			);
			// Last entry wins when a student appears more than once in the payload.
			const requested = new Map<string, AttendanceStatus>(
				command.records.map((record) => [record.studentId, record.status]),
			);

			const changed: WorkshopAttendanceRecord[] = [];
			for (const [studentId, status] of requested) {
				const existing = existingByStudent.get(studentId);
				if (!existing) {
					changed.push(
						WorkshopAttendanceRecord.create({
							tenantId: commission.tenantId,
							workshopCommissionId: commission.id,
							courseId: commission.courseId,
							studentId,
							date: command.date,
							status,
							editedBy: command.userId,
						}),
					);
					continue;
				}
				if (existing.status === status) continue;
				existing.updateStatus(status, command.userId);
				changed.push(existing);
			}
			if (changed.length > 0) await this.attendanceRepo.bulkSave(changed);
			return changed;
		});

		for (const record of changedRecords) {
			this.em.emit(
				'attendance.registered',
				new AttendanceRegisteredEvent(new Date(), record),
			);
		}
	}
}
