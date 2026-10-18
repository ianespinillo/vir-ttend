import type { IStudentDetailResponse } from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StudentHistoryPage } from './student-history-page';

const student: IStudentDetailResponse = {
	id: 's1',
	fullName: 'García, Juan',
	firstName: 'Juan',
	lastName: 'García',
	documentNumber: '35123456',
	birthDate: new Date(2010, 0, 1),
	age: 16,
	courseId: 'c1',
	courseName: '4° 2 - MORNING',
	status: 'ACTIVE',
	tutorName: 'Tutor',
	tutorPhone: '1100000000',
};

function renderPage() {
	return render(
		<StudentHistoryPage
			student={student}
			academicYearLabel="2026"
			report={null}
			summary={null}
			alerts={[]}
			history={[]}
			subjects={[]}
			onBack={vi.fn()}
			onExport={vi.fn()}
			pendingExport={null}
		/>,
	);
}

describe('StudentHistoryPage', () => {
	it('muestra la identidad del alumno y el ciclo lectivo', () => {
		renderPage();

		expect(screen.getByText('García, Juan')).toBeTruthy();
		expect(screen.getByText(/35123456/)).toBeTruthy();
	});

	it('renderiza las secciones principales', () => {
		renderPage();

		expect(screen.getByText('Presentes')).toBeTruthy();
		expect(screen.getByText('Alumno vs. curso')).toBeTruthy();
		expect(screen.getByText('Asistencia por materia')).toBeTruthy();
		expect(screen.getByText('Historial de asistencia')).toBeTruthy();
	});
});
