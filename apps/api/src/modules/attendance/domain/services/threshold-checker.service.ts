import { AttendanceAlert } from '../entities/attendance-alert.entity';
import { AlertType } from '../value-objects/alert-type.vo';

/**
 * Absence counts at which the school must act (PBA Res. 1650/2024, Anexo 4,
 * sections 24-26); the last one is the student's absence limit.
 */
export const WARNING_ABSENCE_THRESHOLD = 10;
export const CRITICAL_ABSENCE_THRESHOLD = 20;

export interface ReachedThreshold {
	threshold: number;
	alertType: AlertType;
}

export class ThresholdCheckerService {
	/**
	 * Highest threshold reached by the count, unless an alert of its type already
	 * exists. A lower threshold is never raised once a higher one was reached.
	 */
	static check(
		absenceCount: number,
		absenceCap: number,
		existingAlerts: AttendanceAlert[],
	): ReachedThreshold | null {
		const levels: ReachedThreshold[] = [
			{ threshold: WARNING_ABSENCE_THRESHOLD, alertType: AlertType.warning() },
			{ threshold: CRITICAL_ABSENCE_THRESHOLD, alertType: AlertType.critical() },
			{ threshold: absenceCap, alertType: AlertType.exceeded() },
		];
		const reached = levels.reduce<ReachedThreshold | null>(
			(highest, level) =>
				absenceCount >= level.threshold &&
				(!highest || level.threshold >= highest.threshold)
					? level
					: highest,
			null,
		);
		if (!reached) return null;

		const alreadyAlerted = existingAlerts.some((alert) =>
			alert.alertType.equals(reached.alertType),
		);
		return alreadyAlerted ? null : reached;
	}
}
