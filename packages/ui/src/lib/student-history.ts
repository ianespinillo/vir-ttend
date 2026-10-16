import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
	type CourseSummaryEntry,
	type ISubjectResponse,
	type StudentMonthlyEntry,
	isLateStatus,
} from '@repo/common';
import { formatMonthLabel } from './format';

export interface AttendanceStatusMeta {
	label: string;
	className: string;
}

export const ATTENDANCE_STATUS_META: Record<
	AttendanceStatus,
	AttendanceStatusMeta
> = {
	[ATTENDANCE_STATUS.PRESENT]: {
		label: 'Presente',
		className:
			'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
	},
	[ATTENDANCE_STATUS.ABSENT]: {
		label: 'Ausente',
		className:
			'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
	},
	[ATTENDANCE_STATUS.LATE]: {
		label: 'Tarde',
		className:
			'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
	},
	[ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE]: {
		label: 'Tarde (fuera de tolerancia)',
		className:
			'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
	},
	[ATTENDANCE_STATUS.JUSTIFIED]: {
		label: 'Justificada',
		className:
			'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
	},
};

export interface AttendanceTally {
	present: number;
	absent: number;
	late: number;
	justified: number;
	total: number;
	/** (present + late) / total * 100. Null when there are no records. */
	attendancePercent: number | null;
}

export const DAILY_SUBJECT_KEY = '__daily__';
export const DAILY_SUBJECT_LABEL = 'Asistencia diaria';
export const UNKNOWN_SUBJECT_LABEL = 'Materia sin nombre';

export function tallyAttendance(records: AttendanceRecord[]): AttendanceTally {
	let present = 0;
	let absent = 0;
	let late = 0;
	let justified = 0;
	for (const record of records) {
		if (record.status === ATTENDANCE_STATUS.PRESENT) present += 1;
		else if (record.status === ATTENDANCE_STATUS.ABSENT) absent += 1;
		else if (isLateStatus(record.status)) late += 1;
		else if (record.status === ATTENDANCE_STATUS.JUSTIFIED) justified += 1;
	}
	const total = present + absent + late + justified;
	const attendancePercent =
		total === 0 ? null : ((present + late) / total) * 100;
	return { present, absent, late, justified, total, attendancePercent };
}

export interface SubjectBreakdown extends AttendanceTally {
	key: string;
	name: string;
}

export function buildSubjectNameMap(
	subjects: ISubjectResponse[],
): Map<string, string> {
	return new Map(subjects.map((subject) => [subject.id, subject.name]));
}

export function buildSubjectBreakdown(
	records: AttendanceRecord[],
	subjects: ISubjectResponse[],
): SubjectBreakdown[] {
	const nameById = buildSubjectNameMap(subjects);
	const groups = new Map<string, AttendanceRecord[]>();
	for (const record of records) {
		const key = record.subjectId ?? DAILY_SUBJECT_KEY;
		const list = groups.get(key);
		if (list) list.push(record);
		else groups.set(key, [record]);
	}
	return [...groups.entries()]
		.map(([key, list]) => ({
			key,
			name:
				key === DAILY_SUBJECT_KEY
					? DAILY_SUBJECT_LABEL
					: (nameById.get(key) ?? UNKNOWN_SUBJECT_LABEL),
			...tallyAttendance(list),
		}))
		.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'es'));
}

export interface ComparisonPoint {
	label: string;
	alumno: number | null;
	curso: number | null;
}

/** Student attendance derived from the report's absence percentage (authoritative). */
export function studentAttendanceFromAbsencePercent(
	absencePercent: number | null,
): number | null {
	if (absencePercent === null || Number.isNaN(absencePercent)) return null;
	return Math.min(100, Math.max(0, 100 - absencePercent));
}

/** The course summary may deliver a ratio (0..1) or a percentage; normalize to 0..100. */
function normalizeCourseAttendance(value: number): number {
	if (Number.isNaN(value)) return 0;
	return value <= 1 && value > 0 ? value * 100 : value;
}

export function buildStudentCourseComparison(
	studentMonths: StudentMonthlyEntry[],
	courseMonths: CourseSummaryEntry[],
): ComparisonPoint[] {
	const studentByKey = new Map(
		studentMonths.map((entry) => [
			`${entry.year}-${entry.month}`,
			studentAttendanceFromAbsencePercent(entry.absencePercent),
		]),
	);
	return [...courseMonths]
		.sort((a, b) => a.year - b.year || a.month - b.month)
		.map((entry) => ({
			label: `${formatMonthLabel(entry.month, 'short')} ${entry.year}`,
			alumno: studentByKey.get(`${entry.year}-${entry.month}`) ?? null,
			curso:
				entry.averageAttendance === null || Number.isNaN(entry.averageAttendance)
					? null
					: normalizeCourseAttendance(entry.averageAttendance),
		}))
		.filter((point) => point.alumno !== null || point.curso !== null);
}

function recordTime(record: AttendanceRecord): number {
	if (!record.date) return 0;
	const time = new Date(record.date).getTime();
	return Number.isNaN(time) ? 0 : time;
}

export function sortRecordsDesc(
	records: AttendanceRecord[],
): AttendanceRecord[] {
	return [...records].sort((a, b) => recordTime(b) - recordTime(a));
}
