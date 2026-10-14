import { Inject, Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { dayOfWeekOf } from '../../../domain/services/day-of-week.util';
import { MyWorkshopCommissionResponseDto } from '../../dtos/workshop-attendance.response.dto';
import { GetMyWorkshopCommissionsQuery } from './get-my-workshop-commissions.query';

/**
 * Commissions the user can take workshop attendance for (the preceptor's own,
 * or every commission of the tenant for an admin), flagged with whether the
 * commission has a workshop slot on the weekday of the requested date.
 */
@Injectable()
export class GetMyWorkshopCommissionsQueryHandler {
	constructor(
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
	) {}

	async execute(
		query: GetMyWorkshopCommissionsQuery,
	): Promise<MyWorkshopCommissionResponseDto[]> {
		const commissions =
			query.role === ROLES.ADMIN
				? await this.commissionPort.findByTenant(query.tenantId)
				: await this.commissionPort.findByPreceptor(query.userId);
		const day = dayOfWeekOf(query.date);

		return Promise.all(
			commissions
				.filter((commission) => commission.tenantId === query.tenantId)
				.map(async (commission) => {
					const days = day
						? await this.commissionPort.getWorkshopDays(
								commission.courseId,
								commission.number,
							)
						: [];
					return new MyWorkshopCommissionResponseDto({
						commissionId: commission.id,
						code: commission.code,
						number: commission.number,
						courseId: commission.courseId,
						courseName: commission.courseName,
						hasWorkshopToday: day !== undefined && days.includes(day),
					});
				}),
		);
	}
}
