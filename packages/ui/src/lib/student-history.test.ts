import { ATTENDANCE_STATUS, type AttendanceRecord } from '@repo/common';
import { describe, expect, it } from 'vitest';
import {
	buildStudentCourseComparison,
	buildSubjectBreakdown,
	studentAttendanceFromAbsencePercent,
	tallyAttendance,
} from './student-history';

function record(
	status: AttendanceRecord['status'],
	subjectId?: string,
): AttendanceRecord {
	return {
		id: `${status}-${subjectId ?? 'none'}`,
		studentId: 's1',
		studentName: 'Alumno',
		status,
		subjectId,
	};
}

describe('tallyAttendance', () => {
	it('cuenta cada estado y calcula asistencia como (present + late) / total', () => {
		const tally = tallyAttendance([
			record(ATTENDANCE_STATUS.PRESENT),
			record(ATTENDANCE_STATUS.PRESENT),
			record(ATTENDANCE_STATUS.LATE),
			record(ATTENDANCE_STATUS.ABSENT),
			record(ATTENDANCE_STATUS.JUSTIFIED),
		]);

		expect(tally).toEqual({
			present: 2,
			absent: 1,
			late: 1,
			justified: 1,
			total: 5,
			attendancePercent: 60,
		});
	});

	it('devuelve null cuando no hay registros', () => {
		expect(tallyAttendance([]).attendancePercent).toBeNull();
	});
});

describe('buildSubjectBreakdown', () => {
	it('agrupa por materia y usa Asistencia diaria sin subjectId', () => {
		const rows = buildSubjectBreakdown(
			[
				record(ATTENDANCE_STATUS.PRESENT, 'm1'),
				record(ATTENDANCE_STATUS.PRESENT),
				record(ATTENDANCE_STATUS.ABSENT, 'm1'),
			],
			[{ id: 'm1', name: 'Matemática', area: 'x', weeklyHours: 4 }],
		);

		const math = rows.find((row) => row.key === 'm1');
		const daily = rows.find((row) => row.name === 'Asistencia diaria');
		expect(math).toMatchObject({
			name: 'Matemática',
			present: 1,
			absent: 1,
			total: 2,
			attendancePercent: 50,
		});
		expect(daily).toMatchObject({ present: 1, total: 1 });
	});
});

describe('studentAttendanceFromAbsencePercent', () => {
	it('convierte inasistencia en asistencia y preserva null', () => {
		expect(studentAttendanceFromAbsencePercent(25)).toBe(75);
		expect(studentAttendanceFromAbsencePercent(null)).toBeNull();
	});
});

describe('buildStudentCourseComparison', () => {
	it('une por año-mes, ordena y normaliza ratios del curso', () => {
		const points = buildStudentCourseComparison(
			[
				{
					month: 3,
					year: 2026,
					present: 0,
					absent: 0,
					late: 0,
					justified: 0,
					absencePercent: 20,
					status: 'ok',
				},
			],
			[{ month: 3, year: 2026, averageAttendance: 0.9 }],
		);

		expect(points).toHaveLength(1);
		expect(points[0]?.alumno).toBe(80);
		expect(points[0]?.curso).toBe(90);
	});
});
