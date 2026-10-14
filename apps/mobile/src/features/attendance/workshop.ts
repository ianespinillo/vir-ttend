import type {
	AttendanceRecordItem,
	MyWorkshopCommission,
	RecordedAttendanceStatus,
	WorkshopAttendance,
} from './types';

/**
 * Pure helpers for workshop (taller) attendance. No React and no storage, so
 * the API mapping and the labels stay easy to reason about.
 */

/** `1° 4° · Comisión 141`, the same label the web screen shows. */
export const formatCommissionLabel = (
	commission: Pick<MyWorkshopCommission, 'courseName' | 'code'>,
): string => `${commission.courseName} · Comisión ${commission.code}`;

interface WorkshopRecordPayload {
	id?: string | null;
	studentId: string;
	studentName?: string;
	status?: RecordedAttendanceStatus | null;
}

/**
 * `GET /attendance/workshop` returns `status: null` for students without a
 * record; the sheets treat that as an unset status.
 */
export const mapWorkshopAttendance = (
	commissionId: string,
	date: string,
	payload: { records?: WorkshopRecordPayload[] } | null | undefined,
): WorkshopAttendance => ({
	commissionId,
	date,
	records: (payload?.records ?? []).map(
		(record): AttendanceRecordItem => ({
			...(record.id ? { id: record.id } : {}),
			studentId: record.studentId,
			studentName: record.studentName,
			...(record.status ? { status: record.status } : {}),
		}),
	),
});
