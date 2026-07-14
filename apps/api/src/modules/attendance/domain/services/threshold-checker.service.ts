import { AttendanceAlert } from '../entities/attendance-alert.entity';
import { AlertType } from '../value-objects/alert-type.vo';

export class ThresholdCheckerService {
	static check(
		absencePercent: number,
		existingAlerts: AttendanceAlert[],
	): AlertType | null {
		const alertType = AlertType.fromPercent(absencePercent);
		if (!alertType) return null;

		const existingAlert = existingAlerts.some(
			(alert) => alert.alertType.equals(alertType) && !alert.seenAt,
		);
		if (existingAlert) return null;
		return alertType;
	}
}
