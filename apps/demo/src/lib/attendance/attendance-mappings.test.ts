import {
	ATTENDANCE_STATUS,
	DAYOFWEEK,
	type ISubjectResponse,
	ROLES,
} from '@repo/common';
import { describe, expect, it } from 'vitest';
import {
	getInitialAttendanceDate,
	getScopedAttendanceCourseIds,
	getScopedAttendanceSubjects,
	isClassDay,
	toAttendanceEntries,
	toAttendanceGridStudents,
	toDailyCopyInput,
	toJustifyInput,
	toSubjectCopyInput,
} from './attendance-mappings.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const courses = [
	{ id: 'course-a', preceptorId: 'preceptor-a' },
	{ id: 'course-b', preceptorId: 'preceptor-b' },
];

// IScheduleSlotResponse only has id, subjectId, dayOfWeek, startTime, endTime
const scheduleSlots = [
	{
		id: 'slot-1',
		subjectId: 'subject-a',
		dayOfWeek: DAYOFWEEK.MONDAY,
		startTime: '08:00',
		endTime: '09:20',
	},
	{
		id: 'slot-2',
		subjectId: 'subject-b',
		dayOfWeek: DAYOFWEEK.TUESDAY,
		startTime: '09:30',
		endTime: '10:50',
	},
];

// Subjects carry teacherId and courseId
const subjects: ISubjectResponse[] = [
	{
		id: 'subject-a',
		courseId: 'course-a',
		name: 'Matemática',
		area: 'Ciencias Exactas',
		weeklyHours: 4,
		teacherId: 'teacher-a',
		teacherName: 'Ada Docente',
	},
	{
		id: 'subject-b',
		courseId: 'course-b',
		name: 'Historia',
		area: 'Sociales',
		weeklyHours: 3,
		teacherId: 'teacher-b',
		teacherName: 'Beto Docente',
	},
];

const students = [
	{ id: 'student-1', firstName: 'Ana', lastName: 'García' },
	{ id: 'student-2', firstName: 'Beto', lastName: 'López' },
];

const records = [
	{
		id: 'rec-1',
		studentId: 'student-1',
		studentName: 'Ana García',
		status: ATTENDANCE_STATUS.ABSENT,
		courseId: 'course-a',
		date: '2026-06-19',
	},
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getInitialAttendanceDate', () => {
	it('returns the date unchanged on a weekday', () => {
		const thursday = new Date('2026-06-18T12:00:00.000Z'); // Thursday
		expect(getInitialAttendanceDate(thursday)).toBe('2026-06-18');
	});

	it('moves Saturday back to Friday', () => {
		const saturday = new Date('2026-06-20T12:00:00.000Z');
		expect(getInitialAttendanceDate(saturday)).toBe('2026-06-19');
	});

	it('moves Sunday back to Friday', () => {
		const sunday = new Date('2026-06-21T12:00:00.000Z');
		expect(getInitialAttendanceDate(sunday)).toBe('2026-06-19');
	});
});

describe('isClassDay', () => {
	it('returns true when the date day matches a schedule slot for the subject', () => {
		// slot-1 is Monday; 2026-06-15 is a Monday
		expect(isClassDay('2026-06-15', 'subject-a', scheduleSlots)).toBe(true);
	});

	it('returns false when the date day does not match any slot', () => {
		// 2026-06-16 is Tuesday; subject-a has no Tuesday slot
		expect(isClassDay('2026-06-16', 'subject-a', scheduleSlots)).toBe(false);
	});

	it('returns false for a weekend date', () => {
		// 2026-06-20 is Saturday — no class days on weekends
		expect(isClassDay('2026-06-20', 'subject-a', scheduleSlots)).toBe(false);
	});

	it('returns false for an empty date string', () => {
		expect(isClassDay('', 'subject-a', scheduleSlots)).toBe(false);
	});
});

describe('getScopedAttendanceCourseIds', () => {
	it('returns undefined for administrative roles', () => {
		expect(
			getScopedAttendanceCourseIds(courses, subjects, 'admin-a', ROLES.ADMIN),
		).toBeUndefined();
		expect(
			getScopedAttendanceCourseIds(
				courses,
				subjects,
				'superadmin-a',
				ROLES.SUPERADMIN,
			),
		).toBeUndefined();
	});

	it('limits preceptors to their assigned courses', () => {
		expect(
			getScopedAttendanceCourseIds(
				courses,
				subjects,
				'preceptor-a',
				ROLES.PRECEPTOR,
			),
		).toEqual(['course-a']);
	});

	it('limits teachers to courses containing their subjects', () => {
		expect(
			getScopedAttendanceCourseIds(courses, subjects, 'teacher-a', ROLES.TEACHER),
		).toEqual(['course-a']);
	});

	it('returns empty array when userId or role is missing', () => {
		expect(
			getScopedAttendanceCourseIds(courses, subjects, undefined, undefined),
		).toEqual([]);
	});
});

describe('getScopedAttendanceSubjects', () => {
	it('returns all subjects for admin/preceptor', () => {
		expect(getScopedAttendanceSubjects(subjects, 'admin-a', ROLES.ADMIN)).toEqual(
			subjects,
		);
		expect(
			getScopedAttendanceSubjects(subjects, 'preceptor-a', ROLES.PRECEPTOR),
		).toEqual(subjects);
	});

	it('filters subjects by teacherId for teachers', () => {
		expect(
			getScopedAttendanceSubjects(subjects, 'teacher-a', ROLES.TEACHER),
		).toEqual([subjects[0]]);
	});

	it('returns empty array when missing userId or role', () => {
		expect(getScopedAttendanceSubjects(subjects, undefined, undefined)).toEqual(
			[],
		);
	});
});

describe('toAttendanceGridStudents', () => {
	it('merges student list with existing records', () => {
		const grid = toAttendanceGridStudents(students, records);
		expect(grid).toHaveLength(2);
		expect(grid[0]).toMatchObject({
			id: 'student-1',
			name: 'Ana García',
			originalStatus: ATTENDANCE_STATUS.ABSENT,
		});
		expect(grid[0]?.attendanceRecord?.id).toBe('rec-1');
	});

	it('defaults to PRESENT for students without a record', () => {
		const grid = toAttendanceGridStudents(students, []);
		expect(grid[0]?.originalStatus).toBe(ATTENDANCE_STATUS.PRESENT);
		expect(grid[0]?.attendanceRecord).toBeUndefined();
	});
});

describe('toAttendanceEntries', () => {
	it('maps local records map to AttendanceEntry array', () => {
		const localMap = {
			'student-1': {
				id: 'rec-1',
				studentId: 'student-1',
				studentName: 'Ana García',
				status: ATTENDANCE_STATUS.LATE,
			},
		};
		const entries = toAttendanceEntries(localMap, ['student-1', 'student-2']);
		expect(entries).toEqual([
			{ studentId: 'student-1', status: ATTENDANCE_STATUS.LATE },
			{ studentId: 'student-2', status: ATTENDANCE_STATUS.ABSENT },
		]);
	});
});

describe('copy and justify input builders', () => {
	it('builds a daily copy input', () => {
		expect(toDailyCopyInput('course-a', '2026-06-19', '2026-06-18')).toEqual({
			courseId: 'course-a',
			targetDate: '2026-06-19',
			sourceDate: '2026-06-18',
		});
	});

	it('builds a subject copy input', () => {
		expect(toSubjectCopyInput('subject-a', '2026-06-19')).toEqual({
			subjectId: 'subject-a',
			targetDate: '2026-06-19',
			sourceDate: undefined,
		});
	});

	it('builds a justify input with and without notes', () => {
		expect(toJustifyInput('MEDICAL', 'certificate attached')).toEqual({
			reason: 'MEDICAL',
			notes: 'certificate attached',
		});
		expect(toJustifyInput('FAMILY')).toEqual({
			reason: 'FAMILY',
			notes: undefined,
		});
	});
});
