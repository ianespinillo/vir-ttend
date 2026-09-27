import type {
	AttendanceEntry,
	CopyAttendanceInput,
	JustifyInput,
} from '@/lib/store/types';
import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceRecordJustification,
	type AttendanceStatus,
	DAYOFWEEK,
	type IScheduleSlotResponse,
	type ISubjectResponse,
	ROLES,
	type Roles,
} from '@repo/common';
import type { StudentRowItem } from '@repo/ui';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Returns today's ISO date string, falling back to the nearest past weekday
 * when today is a weekend (mirrors the client's getInitialDate logic).
 */
export function getInitialAttendanceDate(today = new Date()): string {
	const day = today.getDay();
	const adjusted = new Date(today);
	if (day === 0) adjusted.setDate(today.getDate() - 2); // Sunday → Friday
	if (day === 6) adjusted.setDate(today.getDate() - 1); // Saturday → Friday
	return adjusted.toISOString().split('T')[0] as string;
}

/**
 * Maps a JS Date.getDay() value (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat) to the
 * DAYOFWEEK enum string. Returns null for Saturday and Sunday since the enum
 * only covers Mon–Fri (the app does not schedule classes on weekends).
 */
function jsDayToDayOfWeek(jsDay: number): DAYOFWEEK | null {
	const map: Record<number, DAYOFWEEK> = {
		1: DAYOFWEEK.MONDAY,
		2: DAYOFWEEK.TUESDAY,
		3: DAYOFWEEK.WEDNESDAY,
		4: DAYOFWEEK.THURSDAY,
		5: DAYOFWEEK.FRIDAY,
	};
	return map[jsDay] ?? null;
}

/**
 * Returns true when the given date falls on a day of week that has at least
 * one schedule slot for the subject.
 */
export function isClassDay(
	date: string,
	subjectId: string,
	scheduleSlots: IScheduleSlotResponse[],
): boolean {
	if (!date) return false;
	const d = new Date(`${date}T12:00:00.000Z`);
	const targetDay = jsDayToDayOfWeek(d.getDay());
	if (!targetDay) return false; // weekend — never a class day
	return scheduleSlots.some(
		(slot) => slot.subjectId === subjectId && slot.dayOfWeek === targetDay,
	);
}

// ---------------------------------------------------------------------------
// Role-based course/subject filtering
// ---------------------------------------------------------------------------

/**
 * Returns the course IDs accessible to the current user for attendance.
 *
 * Because IScheduleSlotResponse only knows subjectId, teacher scoping is
 * resolved via the subject list (subjects carry the teacherId).
 *
 * - Preceptor: only courses where they are the assigned preceptor.
 * - Teacher: only courses containing one of their subjects.
 * - Admin / Superadmin: all courses (undefined = no filter).
 */
export function getScopedAttendanceCourseIds(
	courses: { id: string; preceptorId?: string }[],
	subjects: { id: string; courseId?: string; teacherId?: string }[],
	userId: string | undefined,
	role: Roles | undefined,
): string[] | undefined {
	if (!userId || !role) return [];
	if (role === ROLES.ADMIN || role === ROLES.SUPERADMIN) return undefined;
	if (role === ROLES.PRECEPTOR) {
		return courses.filter((c) => c.preceptorId === userId).map((c) => c.id);
	}
	if (role === ROLES.TEACHER) {
		const ids = subjects
			.filter((s) => s.teacherId === userId && s.courseId)
			.map((s) => s.courseId as string);
		return [...new Set(ids)];
	}
	return [];
}

/**
 * Returns subjects accessible to the teacher (by teacherId) or all subjects
 * for admin/preceptor roles.
 */
export function getScopedAttendanceSubjects(
	subjects: ISubjectResponse[],
	userId: string | undefined,
	role: Roles | undefined,
): ISubjectResponse[] {
	if (!userId || !role) return [];
	if (
		role === ROLES.ADMIN ||
		role === ROLES.SUPERADMIN ||
		role === ROLES.PRECEPTOR
	) {
		return subjects;
	}
	if (role === ROLES.TEACHER) {
		return subjects.filter((s) => s.teacherId === userId);
	}
	return [];
}

// ---------------------------------------------------------------------------
// Grid mapping
// ---------------------------------------------------------------------------

/**
 * Builds the StudentRowItem array that AttendanceGrid / DailyAttendancePage
 * expect, merging the student list with their current attendance records.
 */
export function toAttendanceGridStudents(
	students: { id: string; firstName: string; lastName: string }[],
	records: (AttendanceRecord & {
		justification?: AttendanceRecordJustification;
	})[],
): StudentRowItem[] {
	const recordMap = new Map<string, AttendanceRecord>(
		records.map((r) => [r.studentId, r]),
	);
	return students.map((s) => {
		const record = recordMap.get(s.id);
		return {
			id: s.id,
			name: `${s.firstName} ${s.lastName}`,
			attendanceRecord: record,
			originalStatus: (record?.status ??
				ATTENDANCE_STATUS.PRESENT) as AttendanceStatus,
		};
	});
}

// ---------------------------------------------------------------------------
// Action input builders
// ---------------------------------------------------------------------------

/**
 * Converts a local records map (studentId → AttendanceRecord) to the
 * AttendanceEntry[] that store.markDailyAttendance / markSubjectAttendance
 * expect.
 */
export function toAttendanceEntries(
	localMap: Record<string, AttendanceRecord>,
	studentIds: string[],
): AttendanceEntry[] {
	return studentIds.map((id) => ({
		studentId: id,
		status: localMap[id]?.status ?? ATTENDANCE_STATUS.ABSENT,
	}));
}

/**
 * Builds a CopyAttendanceInput for a daily copy operation.
 */
export function toDailyCopyInput(
	courseId: string,
	targetDate: string,
	sourceDate?: string,
): CopyAttendanceInput {
	return { courseId, targetDate, sourceDate };
}

/**
 * Builds a CopyAttendanceInput for a subject-level copy operation.
 */
export function toSubjectCopyInput(
	subjectId: string,
	targetDate: string,
	sourceDate?: string,
): CopyAttendanceInput {
	return { subjectId, targetDate, sourceDate };
}

/**
 * Builds a JustifyInput from the modal's form values.
 */
export function toJustifyInput(reason: string, notes?: string): JustifyInput {
	return { reason, notes };
}
