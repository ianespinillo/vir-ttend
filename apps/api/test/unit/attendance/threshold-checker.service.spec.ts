import { AttendanceAlert } from '../../../src/modules/attendance/domain/entities/attendance-alert.entity';
import {
	CRITICAL_ABSENCE_THRESHOLD,
	ThresholdCheckerService,
	WARNING_ABSENCE_THRESHOLD,
} from '../../../src/modules/attendance/domain/services/threshold-checker.service';
import { AlertType } from '../../../src/modules/attendance/domain/value-objects/alert-type.vo';

const CAP = 28;

describe('ThresholdCheckerService', () => {
	const makeAlert = (alertType: AlertType, seenAt?: Date): AttendanceAlert =>
		AttendanceAlert.reconstitute({
			id: 'alert-1',
			studentId: 'student-1',
			courseId: 'course-1',
			tenantId: 'tenant-1',
			academicYearId: 'year-1',
			alertType,
			absenceCount: 10,
			threshold: 10,
			seenBy: seenAt ? 'user-1' : undefined,
			seenAt,
			createdAt: new Date(),
		});

	it('exposes the 10 and 20 absence thresholds of the norm', () => {
		expect(WARNING_ABSENCE_THRESHOLD).toBe(10);
		expect(CRITICAL_ABSENCE_THRESHOLD).toBe(20);
	});

	it.each([0, 5, 9.75])(
		'returns null below the first threshold (%p)',
		(count) => {
			expect(ThresholdCheckerService.check(count, CAP, [])).toBeNull();
		},
	);

	it.each([
		[10, 10, 'warning'],
		[10.25, 10, 'warning'],
		[19.75, 10, 'warning'],
		[20, 20, 'critical'],
		[27.75, 20, 'critical'],
		[28, 28, 'exceeded'],
		[35, 28, 'exceeded'],
	])('count %p reaches threshold %p (%s)', (count, threshold, status) => {
		const result = ThresholdCheckerService.check(count, CAP, []);
		expect(result?.threshold).toBe(threshold);
		expect(result?.alertType.status).toBe(status);
	});

	it('uses the given cap for the last threshold', () => {
		expect(ThresholdCheckerService.check(28, 30, [])?.threshold).toBe(20);
		expect(ThresholdCheckerService.check(30, 30, [])?.threshold).toBe(30);
	});

	it('returns null when the alert of the reached threshold already exists', () => {
		const existing = makeAlert(AlertType.warning());
		expect(ThresholdCheckerService.check(12, CAP, [existing])).toBeNull();
	});

	it('treats a seen alert as already raised', () => {
		const seen = makeAlert(AlertType.warning(), new Date());
		expect(ThresholdCheckerService.check(12, CAP, [seen])).toBeNull();
	});

	it('escalates to the next threshold when only lower ones were raised', () => {
		const warning = makeAlert(AlertType.warning());
		const result = ThresholdCheckerService.check(21, CAP, [warning]);
		expect(result?.alertType.status).toBe('critical');
	});

	it('does not fall back to a lower threshold already skipped', () => {
		const critical = makeAlert(AlertType.critical());
		expect(ThresholdCheckerService.check(25, CAP, [critical])).toBeNull();
	});

	it('raises only the highest threshold when several are crossed at once', () => {
		const result = ThresholdCheckerService.check(29, CAP, []);
		expect(result?.alertType.status).toBe('exceeded');
	});
});
