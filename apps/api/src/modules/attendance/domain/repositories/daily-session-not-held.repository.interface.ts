import { DailySessionNotHeld } from '../entities/daily-session-not-held.entity';

export interface IDailySessionNotHeldRepository {
	/** The marker of a course for a calendar day, if its theory was not held. */
	findByCourseAndDate(
		courseId: string,
		date: Date,
	): Promise<DailySessionNotHeld | null>;

	/** Markers of a course, `from` to `to` inclusive. */
	findByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<DailySessionNotHeld[]>;

	save(marker: DailySessionNotHeld): Promise<void>;

	/** Removes the marker of a course for a calendar day; none is a no-op. */
	delete(courseId: string, date: Date): Promise<void>;
}
