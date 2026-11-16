import { Inject, Injectable } from '@nestjs/common';
import { ROLES, workshopAvailabilityOn } from '@repo/common';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../domain/repositories/workshop-attendance-record.repository.interface';
import { dayOfWeekOf } from '../../../domain/services/day-of-week.util';
import { toDateKey } from '../../../domain/services/weighted-absence';
import { MyWorkshopCommissionResponseDto } from '../../dtos/workshop-attendance.response.dto';
import { GetMyWorkshopCommissionsQuery } from './get-my-workshop-commissions.query';

/**
 * Commissions the user can take workshop attendance for (the preceptor's own,
 * or every commission of the tenant for an admin), flagged with whether the
 * commission has a workshop slot on the weekday of the requested date, what its
 * schedule says about that day and whether it already has saved records then.
 */
@Injectable()
export class GetMyWorkshopCommissionsQueryHandler {
	constructor(
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly attendanceRepo: IWorkshopAttendanceRecordRepository,
	) {}

	async execute(
		query: GetMyWorkshopCommissionsQuery,
	): Promise<MyWorkshopCommissionResponseDto[]> {
		const commissions =
			query.role === ROLES.ADMIN
				? await this.commissionPort.findByTenant(query.tenantId)
				: await this.commissionPort.findByPreceptor(query.userId);
		const day = dayOfWeekOf(query.date);
		const visible = commissions.filter(
			(commission) => commission.tenantId === query.tenantId,
		);
		const withRecords = new Set(
			await this.attendanceRepo.findCommissionIdsWithRecordsOn(
				visible.map((commission) => commission.id),
				query.date,
			),
		);

		return Promise.all(
			visible.map(async (commission) => {
				const days = await this.commissionPort.getWorkshopDays(
					commission.courseId,
					commission.number,
				);
				return new MyWorkshopCommissionResponseDto({
					commissionId: commission.id,
					code: commission.code,
					number: commission.number,
					courseId: commission.courseId,
					courseName: commission.courseName,
					hasWorkshopToday: day !== undefined && days.includes(day),
					workshopAvailability: workshopAvailabilityOn(days, toDateKey(query.date)),
					hasSavedRecords: withRecords.has(commission.id),
				});
			}),
		);
	}
}
