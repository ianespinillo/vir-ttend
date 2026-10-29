import { ATTENDANCE_STATUS, type MyWorkshopCommission } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	WorkshopAttendancePage,
	type WorkshopAttendancePageProps,
	formatCommissionLabel,
} from './workshop-attendance-page';

const commission: MyWorkshopCommission = {
	commissionId: 'c-1',
	code: '141',
	number: 1,
	courseId: 'course-1',
	courseName: '1° 4°',
	hasWorkshopToday: true,
};

function renderPage(overrides: Partial<WorkshopAttendancePageProps> = {}) {
	const props: WorkshopAttendancePageProps = {
		commissions: [commission],
		gridStudents: [
			{
				id: 's-1',
				name: 'Perez, Juan',
				attendanceRecord: {
					id: 'r-1',
					studentId: 's-1',
					studentName: 'Perez, Juan',
					status: ATTENDANCE_STATUS.PRESENT,
				},
				originalStatus: ATTENDANCE_STATUS.PRESENT,
			},
		],
		selectedCommissionId: '',
		selectedDate: '2026-03-10',
		isLoadingCommissions: false,
		isLoadingAttendance: false,
		isSaving: false,
		onCommissionChange: vi.fn(),
		onDateChange: vi.fn(),
		onStatusChange: vi.fn(),
		onMarkAll: vi.fn(),
		onConfirmChanges: vi.fn(),
		onResetChanges: vi.fn(),
		...overrides,
	};
	render(<WorkshopAttendancePage {...props} />);
	return props;
}

describe('formatCommissionLabel', () => {
	it('joins the course name and the commission code', () => {
		expect(formatCommissionLabel(commission)).toBe('1° 4° · Comisión 141');
	});
});

describe('WorkshopAttendancePage', () => {
	it('shows an empty state when the user has no commissions', () => {
		renderPage({ commissions: [] });
		expect(screen.getByText('Sin comisiones asignadas')).toBeInTheDocument();
	});

	it('lists commissions and notifies the selected one', () => {
		const props = renderPage();
		expect(screen.getByText('Hay taller este día')).toBeInTheDocument();
		fireEvent.click(screen.getByText('1° 4° · Comisión 141'));
		expect(props.onCommissionChange).toHaveBeenCalledWith('c-1');
		expect(screen.queryByText('Perez, Juan')).not.toBeInTheDocument();
	});

	it('shows the student grid for the selected commission', () => {
		renderPage({ selectedCommissionId: 'c-1' });
		expect(screen.getByText('Perez, Juan')).toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('warns when the selected commission has no workshop that day', () => {
		renderPage({
			commissions: [{ ...commission, hasWorkshopToday: false }],
			selectedCommissionId: 'c-1',
		});
		expect(screen.getByText('Sin taller este día')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent(
			'no tiene taller programado este día',
		);
	});

	it('marks everyone present and confirms changes', () => {
		const props = renderPage({ selectedCommissionId: 'c-1' });
		fireEvent.click(screen.getByText('Todos Presentes'));
		expect(props.onMarkAll).toHaveBeenCalledWith(ATTENDANCE_STATUS.PRESENT);
		fireEvent.click(screen.getByText('Confirmar'));
		expect(props.onConfirmChanges).toHaveBeenCalled();
	});

	describe('justification', () => {
		const absentRecord = {
			id: 'r-1',
			studentId: 's-1',
			studentName: 'Perez, Juan',
			status: ATTENDANCE_STATUS.ABSENT,
		};
		const absentStudent = {
			id: 's-1',
			name: 'Perez, Juan',
			attendanceRecord: absentRecord,
			originalStatus: ATTENDANCE_STATUS.ABSENT,
		};

		it('does not offer Justificar when onJustify is not provided', () => {
			renderPage({ selectedCommissionId: 'c-1', gridStudents: [absentStudent] });
			expect(screen.queryByText('Justificar')).not.toBeInTheDocument();
		});

		it('offers Justificar for a saved absent record and notifies it', () => {
			const onJustify = vi.fn();
			renderPage({
				selectedCommissionId: 'c-1',
				gridStudents: [absentStudent],
				onJustify,
			});
			fireEvent.click(screen.getByText('Justificar'));
			expect(onJustify).toHaveBeenCalledWith(absentRecord);
		});

		it('does not offer Justificar for an unsaved record', () => {
			renderPage({
				selectedCommissionId: 'c-1',
				gridStudents: [
					{
						...absentStudent,
						attendanceRecord: { ...absentRecord, id: '' },
					},
				],
				onJustify: vi.fn(),
			});
			expect(screen.queryByText('Justificar')).not.toBeInTheDocument();
		});

		it('shows the Justificado badge when the record has a justification', () => {
			renderPage({
				selectedCommissionId: 'c-1',
				gridStudents: [
					{
						...absentStudent,
						attendanceRecord: {
							...absentRecord,
							justification: {
								id: 'j-1',
								reason: 'Enfermedad',
								createdBy: 'u-1',
								createdAt: new Date('2026-03-10T10:00:00.000Z'),
							},
						},
					},
				],
				onJustify: vi.fn(),
			});
			expect(screen.getByText('Justificado')).toBeInTheDocument();
			expect(screen.queryByText('Justificar')).not.toBeInTheDocument();
		});
	});
});

describe('WorkshopAttendancePage bulk justification', () => {
	it('hides the bulk button when nothing is selected', () => {
		renderPage({
			selectedCommissionId: 'c-1',
			selectedRecordIds: new Set(),
			onBulkJustify: vi.fn(),
		});
		expect(
			screen.queryByText(/Justificar seleccionados/),
		).not.toBeInTheDocument();
	});

	it('shows the bulk button with the count and calls onBulkJustify', () => {
		const props = renderPage({
			selectedCommissionId: 'c-1',
			selectedRecordIds: new Set(['r-1', 'r-2']),
			onBulkJustify: vi.fn(),
		});
		fireEvent.click(
			screen.getByRole('button', { name: /Justificar seleccionados \(2\)/ }),
		);
		expect(props.onBulkJustify).toHaveBeenCalledTimes(1);
	});

	it('titles the justification modal with the number of students in bulk mode', () => {
		renderPage({
			selectedCommissionId: 'c-1',
			onJustify: vi.fn(),
			onCloseJustify: vi.fn(),
			onConfirmJustify: vi.fn(),
			isJustifyOpen: true,
			bulkJustifyCount: 2,
		});
		expect(screen.getByText('Justificar 2 alumnos')).toBeInTheDocument();
	});
});

describe('WorkshopAttendancePage workshop not held', () => {
	it('renders nothing new when the not-held props are absent', () => {
		renderPage({ selectedCommissionId: 'c-1' });
		expect(
			screen.queryByRole('button', { name: /Taller no dictado/ }),
		).toBeNull();
	});

	it('offers the action only with a selected commission', () => {
		renderPage({ onMarkNotHeld: vi.fn() });
		expect(
			screen.queryByRole('button', { name: /Taller no dictado/ }),
		).toBeNull();
	});

	it('warns about the saved records that will be deleted and confirms with the reason', () => {
		const props = renderPage({
			selectedCommissionId: 'c-1',
			onMarkNotHeld: vi.fn(),
		});
		fireEvent.click(screen.getByRole('button', { name: /Taller no dictado/ }));
		expect(
			screen.getByText('Se va a borrar 1 registro de asistencia de este día.'),
		).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText(/Motivo/), {
			target: { value: 'Docente ausente' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
		expect(props.onMarkNotHeld).toHaveBeenCalledWith('Docente ausente');
	});

	it('does not call the handler when the confirmation is cancelled', () => {
		const props = renderPage({
			selectedCommissionId: 'c-1',
			onMarkNotHeld: vi.fn(),
		});
		fireEvent.click(screen.getByRole('button', { name: /Taller no dictado/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(props.onMarkNotHeld).not.toHaveBeenCalled();
	});

	describe('when the workshop was not held', () => {
		it('replaces the grid and the save actions with the notice and its reason', () => {
			renderPage({
				selectedCommissionId: 'c-1',
				notHeld: { reason: 'Docente ausente' },
				onMarkNotHeld: vi.fn(),
				onUnmarkNotHeld: vi.fn(),
			});
			expect(screen.getByText('Motivo: Docente ausente')).toBeInTheDocument();
			expect(screen.queryByText('Perez, Juan')).toBeNull();
			expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
			expect(
				screen.queryByRole('button', { name: 'Taller no dictado' }),
			).toBeNull();
		});

		it('disables the quick actions', () => {
			renderPage({
				selectedCommissionId: 'c-1',
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
				selectedCommissionId: 'c-1',
				notHeld: {},
				onUnmarkNotHeld: vi.fn(),
			});
			fireEvent.click(screen.getByRole('button', { name: 'Marcar como dictado' }));
			expect(props.onUnmarkNotHeld).toHaveBeenCalledTimes(1);
		});
	});
});
