/**
 * Demo store — absence alert generation.
 *
 * Mirrors the API (GenerateAlertHandler + ThresholdCheckerService): after
 * attendance is saved, the weighted absence count of the student is compared
 * against 10 (warning), 20 (critical) and the institutional cap (exceeded). A
 * single alert is raised per type and a lower threshold is never raised once a
 * higher one was reached. The seed replays the history day by day so the
 * seeded alerts are exactly the ones the product would have raised.
 */

import type { Alert, AlertType } from '@repo/common';
import { getStudentAttendanceTotals } from './selectors';
import type {
	DemoAttendanceRecord,
	DemoState,
	DemoStudent,
	DemoWorkshopRecord,
} from './types';
import { calculateWeightedAbsences, checkThreshold } from './weighted-absence';

export type AlertIdFactory = (
	studentId: string,
	alertType: AlertType,
) => string;

function alertFor(
	student: Pick<DemoStudent, 'id' | 'fullName' | 'courseId' | 'courseName'>,
	reached: { alertType: AlertType; threshold: number },
	absenceCount: number,
	createdAt: Date,
	makeId: AlertIdFactory,
): Alert {
	return {
		id: makeId(student.id, reached.alertType),
		studentId: student.id,
		studentName: student.fullName,
		courseId: student.courseId,
		courseName: student.courseName ?? '',
		alertType: reached.alertType,
		absenceCount,
		threshold: reached.threshold,
		seenAt: null,
		createdAt,
	};
}

/**
 * Alert a student's current weighted absences raise, or null when no new
 * threshold was reached (or its alert already exists).
 */
export function evaluateStudentAlert(
	state: DemoState,
	studentId: string,
	createdAt: Date,
	makeId: AlertIdFactory,
): Alert | null {
	const student = state.students.find((item) => item.id === studentId);
	if (!student) return null;
	const totals = getStudentAttendanceTotals(state, studentId);
	const existing = new Set(
		state.alerts
			.filter((alert) => alert.studentId === studentId)
			.map((alert) => alert.alertType),
	);
	const reached = checkThreshold(totals.absent, existing);
	if (!reached) return null;
	return alertFor(student, reached, totals.absent, createdAt, makeId);
}

/**
 * Replays the attendance history chronologically and returns the alerts raised
 * along the way (one per crossed threshold), dated at the crossing day.
 */
export function replayAlerts(
	students: readonly DemoStudent[],
	attendance: readonly DemoAttendanceRecord[],
	workshopAttendance: readonly DemoWorkshopRecord[],
	workshopOnlyOf: (student: DemoStudent) => boolean,
	makeId: AlertIdFactory,
): Alert[] {
	const alerts: Alert[] = [];
	for (const student of students) {
		const daily = attendance
			.filter((record) => record.studentId === student.id && !record.subjectId)
			.sort((a, b) => a.date.localeCompare(b.date));
		const workshop = workshopAttendance
			.filter((record) => record.studentId === student.id)
			.sort((a, b) => a.date.localeCompare(b.date));
		const dates = [
			...new Set([...daily, ...workshop].map((record) => record.date)),
		].sort();
		const workshopOnly = workshopOnlyOf(student);
		const raised = new Set<AlertType>();
		for (const date of dates) {
			const { total } = calculateWeightedAbsences({
				dailyRecords: daily.filter((record) => record.date <= date),
				workshopRecords: workshop.filter((record) => record.date <= date),
				workshopOnly,
			});
			const reached = checkThreshold(total, raised);
			if (!reached) continue;
			raised.add(reached.alertType);
			alerts.push(
				alertFor(
					student,
					reached,
					total,
					new Date(`${date}T09:30:00.000Z`),
					makeId,
				),
			);
		}
	}
	return alerts;
}
