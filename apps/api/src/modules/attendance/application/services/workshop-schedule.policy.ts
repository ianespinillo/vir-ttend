import { workshopAvailabilityOn } from '@repo/common';
import { DomainError } from '../../../../common/errors';
import {
	IWorkshopCommissionPort,
	WorkshopCommissionInfo,
} from '../../domain/ports/workshop-commission.port.interface';
import { toDateKey } from '../../domain/services/weighted-absence';

export const WORKSHOP_NOT_SCHEDULED_MESSAGE =
	'La comisión no tiene taller ese día según el horario del curso.';

/**
 * Workshop attendance can only be registered on a weekday the commission has a
 * workshop, per the course schedule. Uses the same rule as the clients
 * (`workshopAvailabilityOn`): a course with no workshop slots loaded cannot be
 * decided, so it is not blocked. Only registration is guarded: clearing a day
 * (mark as not held) must stay possible for records saved by mistake.
 */
export async function assertWorkshopScheduledOn(
	commissionPort: IWorkshopCommissionPort,
	commission: Pick<WorkshopCommissionInfo, 'courseId' | 'number'>,
	date: Date,
): Promise<void> {
	const workshopDays = await commissionPort.getWorkshopDays(
		commission.courseId,
		commission.number,
	);
	if (workshopAvailabilityOn(workshopDays, toDateKey(date)) === 'unscheduled') {
		throw new DomainError(WORKSHOP_NOT_SCHEDULED_MESSAGE);
	}
}
