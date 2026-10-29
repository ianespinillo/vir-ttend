import { DomainError } from '../../../../common/errors';
import { IWorkshopSessionNotHeldRepository } from '../../domain/repositories/workshop-session-not-held.repository.interface';

export const WORKSHOP_SESSION_NOT_HELD_MESSAGE =
	'El taller de ese día está marcado como no dictado.';

/**
 * No workshop attendance can be registered for a day the commission's workshop
 * was marked as not held; the marker has to be removed first.
 */
export async function assertWorkshopSessionHeld(
	notHeldRepo: IWorkshopSessionNotHeldRepository,
	commissionId: string,
	date: Date,
): Promise<void> {
	if (await notHeldRepo.findByCommissionAndDate(commissionId, date)) {
		throw new DomainError(WORKSHOP_SESSION_NOT_HELD_MESSAGE);
	}
}
