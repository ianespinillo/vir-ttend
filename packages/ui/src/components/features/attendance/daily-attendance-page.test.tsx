import {
	ATTENDANCE_STATUS,
	type ICourseResponse,
	LEVEL,
	SHIFT,
} from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	DailyAttendancePage,
	type DailyAttendancePageProps,
	filterDailyAttendanceCourses,
} from './daily-attendance-page';

const course = (
	id: string,
	level: ICourseResponse['level'],
	yearNumber: number,
): ICourseResponse => ({
	id,
	level,
	yearNumber,
	division: 'A',
	shift: SHIFT.MORNING,
	fullName: `${yearNumber}° A`,
});

const sixth = course('c-6', LEVEL.SECONDARY, 6);
const seventh = course('c-7', LEVEL.SECONDARY, 7);
const primarySeventh = course('c-p7', LEVEL.PRIMARY, 7);

function renderPage(overrides: Partial<DailyAttendancePageProps> = {}) {
	const props: DailyAttendancePageProps = {
		courses: [sixth, seventh],
		gridStudents: [],
		metrics: null,
		selectedCourseId: '',
		selectedDate: '2026-03-10',
		isLoadingCourses: false,
		isLoadingDaily: false,
		isLoadingMetrics: false,
		isSaving: false,
		isBulkSaving: false,
		onCourseChange: vi.fn(),
		onDateChange: vi.fn(),
		onStatusChange: vi.fn(),
		onMarkAll: vi.fn(),
		onJustify: vi.fn(),
		isJustifyOpen: false,
		selectedRecordToJustify: null,
		onCloseJustify: vi.fn(),
		onConfirmJustify: vi.fn(),
		isSubmittingJustify: false,
		isCopyOpen: false,
		onOpenCopy: vi.fn(),
		onCloseCopy: vi.fn(),
		onConfirmCopy: vi.fn(),
		isSubmittingCopy: false,
		...overrides,
	};
	render(<DailyAttendancePage {...props} />);
	return props;
}

describe('filterDailyAttendanceCourses', () => {
	it('leaves out 7th-year technical courses (workshop only) and keeps the rest', () => {
		expect(
			filterDailyAttendanceCourses([sixth, seventh, primarySeventh]),
		).toEqual([sixth, primarySeventh]);
	});
});

describe('DailyAttendancePage', () => {
	it('explains that a workshop-only course has no daily attendance', () => {
		renderPage({
			selectedCourseId: 'c-7',
			workshopAttendanceHref: '/attendance/workshop',
		});
		expect(screen.getByText(/no tienen asistencia diaria/i)).toBeInTheDocument();
		expect(
			screen.getByRole('link', { name: /asistencia de taller/i }),
		).toHaveAttribute('href', '/attendance/workshop');
		expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
	});

	it('shows the attendance grid actions for a regular course', () => {
		renderPage({ selectedCourseId: 'c-6' });
		expect(screen.queryByText(/no tienen asistencia diaria/i)).toBeNull();
		expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
	});
});

describe('DailyAttendancePage bulk justification', () => {
	it('hides the bulk button when nothing is selected', () => {
		renderPage({
			selectedCourseId: 'c-6',
			selectedRecordIds: new Set(),
			onBulkJustify: vi.fn(),
		});
		expect(screen.queryByText(/Justificar seleccionados/)).toBeNull();
	});

	it('shows the bulk button with the count and calls onBulkJustify', () => {
		const props = renderPage({
			selectedCourseId: 'c-6',
			selectedRecordIds: new Set(['r-1', 'r-2', 'r-3']),
			onBulkJustify: vi.fn(),
		});
		fireEvent.click(
			screen.getByRole('button', { name: /Justificar seleccionados \(3\)/ }),
		);
		expect(props.onBulkJustify).toHaveBeenCalledTimes(1);
	});

	it('titles the justification modal with the number of students in bulk mode', () => {
		renderPage({
			selectedCourseId: 'c-6',
			isJustifyOpen: true,
			bulkJustifyCount: 5,
		});
		expect(screen.getByText('Justificar 5 alumnos')).toBeInTheDocument();
	});
});

describe('DailyAttendancePage class not held', () => {
	const savedStudent = (id: string) => ({
		id: `s-${id}`,
		name: `Alumno ${id}`,
		attendanceRecord: {
			id: `r-${id}`,
			studentId: `s-${id}`,
			studentName: `Alumno ${id}`,
			status: ATTENDANCE_STATUS.PRESENT,
		},
		originalStatus: ATTENDANCE_STATUS.PRESENT,
	});

	it('renders nothing new when the not-held props are absent', () => {
		renderPage({ selectedCourseId: 'c-6' });
		expect(screen.queryByRole('button', { name: /Clase no dictada/ })).toBeNull();
		expect(screen.queryByText(/Marcar como dictada/)).toBeNull();
	});

	it('offers the action only with a selected daily course', () => {
		renderPage({ selectedCourseId: '', onMarkNotHeld: vi.fn() });
		expect(screen.queryByRole('button', { name: /Clase no dictada/ })).toBeNull();
	});

	it('does not offer the action for a workshop-only course', () => {
		renderPage({ selectedCourseId: 'c-7', onMarkNotHeld: vi.fn() });
		expect(screen.queryByRole('button', { name: /Clase no dictada/ })).toBeNull();
	});

	it('warns about the saved records that will be deleted and confirms with the reason', () => {
		const props = renderPage({
			selectedCourseId: 'c-6',
			gridStudents: [savedStudent('1'), savedStudent('2')],
			onMarkNotHeld: vi.fn(),
		});
		fireEvent.click(screen.getByRole('button', { name: /Clase no dictada/ }));
		expect(
			screen.getByText('Se van a borrar 2 registros de asistencia de este día.'),
		).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText(/Motivo/), {
			target: { value: '  Docente ausente ' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
		expect(props.onMarkNotHeld).toHaveBeenCalledWith('Docente ausente');
	});

	it('confirms without a reason when none is typed and nothing is saved', () => {
		const props = renderPage({
			selectedCourseId: 'c-6',
			onMarkNotHeld: vi.fn(),
		});
		fireEvent.click(screen.getByRole('button', { name: /Clase no dictada/ }));
		expect(screen.queryByText(/Se van a borrar/)).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
		expect(props.onMarkNotHeld).toHaveBeenCalledWith(undefined);
	});

	it('does not call the handler when the confirmation is cancelled', () => {
		const props = renderPage({
			selectedCourseId: 'c-6',
			onMarkNotHeld: vi.fn(),
		});
		fireEvent.click(screen.getByRole('button', { name: /Clase no dictada/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(props.onMarkNotHeld).not.toHaveBeenCalled();
	});

	describe('when the class was not held', () => {
		it('replaces the grid and the save actions with the notice and its reason', () => {
			renderPage({
				selectedCourseId: 'c-6',
				gridStudents: [savedStudent('1')],
				notHeld: { reason: 'Docente ausente' },
				onMarkNotHeld: vi.fn(),
				onUnmarkNotHeld: vi.fn(),
			});
			expect(screen.getByText('Motivo: Docente ausente')).toBeInTheDocument();
			expect(screen.queryByText('Alumno 1')).toBeNull();
			expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
			expect(
				screen.queryByRole('button', { name: 'Clase no dictada' }),
			).toBeNull();
		});

		it('disables the quick actions', () => {
			renderPage({
				selectedCourseId: 'c-6',
				notHeld: {},
				onUnmarkNotHeld: vi.fn(),
			});
			expect(
				screen.getByRole('button', { name: /Todos Presentes/ }),
			).toBeDisabled();
			expect(
				screen.getByRole('button', { name: /Todos Ausentes/ }),
			).toBeDisabled();
		});

		it('calls onUnmarkNotHeld from the notice', () => {
			const props = renderPage({
				selectedCourseId: 'c-6',
				notHeld: {},
				onUnmarkNotHeld: vi.fn(),
			});
			fireEvent.click(screen.getByRole('button', { name: 'Marcar como dictada' }));
			expect(props.onUnmarkNotHeld).toHaveBeenCalledTimes(1);
		});

		it('disables the unmark action while pending', () => {
			renderPage({
				selectedCourseId: 'c-6',
				notHeld: {},
				onUnmarkNotHeld: vi.fn(),
				isNotHeldPending: true,
			});
			expect(
				screen.getByRole('button', { name: 'Marcar como dictada' }),
			).toBeDisabled();
		});
	});
});
