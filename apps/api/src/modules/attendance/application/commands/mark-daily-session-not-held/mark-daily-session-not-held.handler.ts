import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { DailySessionNotHeld } from '../../../domain/entities/daily-session-not-held.entity';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { IDailySessionNotHeldRepository } from '../../../domain/repositories/daily-session-not-held.repository.interface';
import { assertCourseHasDailyAttendance } from '../../services/daily-attendance.policy';
import { MarkDailySessionNotHeldCommand } from './mark-daily-session-not-held.command';

/**
 * Marks the theory shift of a course as not held on a date. The daily records
 * already saved for that day are deleted (the caller confirms first) and
 * registering new ones is blocked until the marker is removed. Idempotent:
 * marking an already marked day only updates the reason.
 *
 * Subject records of the day are left untouched.
 */
@Injectable()
export class MarkDailySessionNotHeldHandler {
	constructor(
		@Inject('IDailySessionNotHeldRepository')
		private readonly notHeldRepo: IDailySessionNotHeldRepository,
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
	) {}

	async execute(
		command: MarkDailySessionNotHeldCommand,
	): Promise<{ deletedRecords: number }> {
		const course = await this.coursePort.findById(command.courseId);
		// A course of another tenant is reported as missing, not forbidden, so
		// its existence is not revealed.
		if (!course || course.tenantId !== command.tenantId)
			throw new NotFoundError('Curso no encontrado');
		await assertCourseHasDailyAttendance(this.coursePort, command.courseId);

		const reason = command.reason?.trim() || undefined;
		return this.unitOfWork.run(async () => {
			const deletedRecords = await this.attendanceRepo.deleteDailyByCourseAndDate(
				command.courseId,
				command.date,
			);
			const existing = await this.notHeldRepo.findByCourseAndDate(
				command.courseId,
				command.date,
			);
			if (existing) {
				if (existing.reason !== reason) {
					existing.changeReason(reason);
					await this.notHeldRepo.save(existing);
				}
			} else {
				await this.notHeldRepo.save(
					DailySessionNotHeld.create({
						tenantId: command.tenantId,
						courseId: command.courseId,
						date: command.date,
						reason,
						createdBy: command.userId,
					}),
				);
			}
			return { deletedRecords };
		});
	}
}
