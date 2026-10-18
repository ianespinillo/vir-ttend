import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type ISubjectResponse,
} from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StudentSubjectBreakdown } from './student-subject-breakdown';

const subjects: ISubjectResponse[] = [
	{ id: 'm1', name: 'Matemática', area: 'Exactas', weeklyHours: 4 },
];

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

describe('StudentSubjectBreakdown', () => {
	it('muestra el nombre de la materia y su porcentaje de asistencia', () => {
		render(
			<StudentSubjectBreakdown
				records={[
					record(ATTENDANCE_STATUS.PRESENT, 'm1'),
					record(ATTENDANCE_STATUS.ABSENT, 'm1'),
				]}
				subjects={subjects}
			/>,
		);

		expect(screen.getByText('Matemática')).toBeTruthy();
		expect(screen.getByText('50.0%')).toBeTruthy();
	});

	it('agrupa los registros sin materia como Asistencia diaria', () => {
		render(
			<StudentSubjectBreakdown
				records={[record(ATTENDANCE_STATUS.PRESENT)]}
				subjects={subjects}
			/>,
		);

		expect(screen.getByText('Asistencia diaria')).toBeTruthy();
	});
});
