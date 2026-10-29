import { WorkshopSessionNotHeld } from '../entities/workshop-session-not-held.entity';

export interface IWorkshopSessionNotHeldRepository {
	/** The marker of a commission for a calendar day, if its workshop was not held. */
	findByCommissionAndDate(
		commissionId: string,
		date: Date,
	): Promise<WorkshopSessionNotHeld | null>;

	/** Markers of a commission, `from` to `to` inclusive. */
	findByCommissionAndDateRange(
		commissionId: string,
		from: Date,
		to: Date,
	): Promise<WorkshopSessionNotHeld[]>;

	/** Markers of several commissions in a single query, `from` to `to` inclusive. */
	findByCommissionIdsAndDateRange(
		commissionIds: string[],
		from: Date,
		to: Date,
	): Promise<WorkshopSessionNotHeld[]>;

	save(marker: WorkshopSessionNotHeld): Promise<void>;

	/** Removes the marker of a commission for a calendar day; none is a no-op. */
	delete(commissionId: string, date: Date): Promise<void>;
}
