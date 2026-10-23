import { ATTENDANCE_STATUS, type AttendanceRecord } from '@repo/common';

/**
 * Absences and late arrivals of a saved record can be justified (same rule as
 * the API). An already justified record is shown with its badge instead.
 */
export function isJustifiableRecord(
	record: AttendanceRecord | undefined,
): record is AttendanceRecord {
	if (!record?.id) return false;
	return (
		record.status === ATTENDANCE_STATUS.ABSENT ||
		record.status === ATTENDANCE_STATUS.LATE ||
		record.status === ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE
	);
}

/**
 * A row can join a bulk justification when its record is justifiable, has no
 * justification yet and its status was not edited since it was saved.
 */
export function isBulkJustifiableRow(row: {
	attendanceRecord?: AttendanceRecord;
	originalStatus?: AttendanceRecord['status'];
}): boolean {
	const record = row.attendanceRecord;
	if (!isJustifiableRecord(record) || record.justification) return false;
	return (
		row.originalStatus === undefined || row.originalStatus === record.status
	);
}
