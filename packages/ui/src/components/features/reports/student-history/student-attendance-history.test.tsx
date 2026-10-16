import { ATTENDANCE_STATUS, type AttendanceRecord } from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StudentAttendanceHistory } from './student-attendance-history';

describe('StudentAttendanceHistory', () => {
	it('muestra la fecha y el estado de un registro presente', () => {
		render(
			<StudentAttendanceHistory
				records={[
					{
						id: 'r1',
						studentId: 's1',
						studentName: 'Alumno',
						status: ATTENDANCE_STATUS.PRESENT,
						date: new Date(2026, 2, 10),
					},
				]}
				subjects={[]}
			/>,
		);

		expect(screen.getByText('10/03/2026')).toBeTruthy();
		expect(screen.getByText('Presente')).toBeTruthy();
		expect(screen.getByText('Asistencia diaria')).toBeTruthy();
	});

	it('muestra el motivo cuando el registro está justificado', () => {
		const justified: AttendanceRecord = {
			id: 'r2',
			studentId: 's1',
			studentName: 'Alumno',
			status: ATTENDANCE_STATUS.JUSTIFIED,
			justification: {
				id: 'j1',
				reason: 'Certificado médico',
				createdBy: 'u1',
				createdAt: new Date(2026, 2, 10),
			},
		};

		render(<StudentAttendanceHistory records={[justified]} subjects={[]} />);

		expect(screen.getByText('Justificación: Certificado médico')).toBeTruthy();
		expect(screen.getByText('Justificada')).toBeTruthy();
	});
});
