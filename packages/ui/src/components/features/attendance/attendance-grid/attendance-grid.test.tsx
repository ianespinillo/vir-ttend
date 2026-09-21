import { ATTENDANCE_STATUS } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttendanceGrid } from './attendance-grid';
import type { StudentRowItem } from './attendance-row';

describe('AttendanceGrid', () => {
	const mockStudents: StudentRowItem[] = [
		{
			id: 's-1',
			name: 'Juan Perez',
			attendanceRecord: {
				id: 'rec-1',
				studentId: 's-1',
				studentName: 'Juan Perez',
				status: ATTENDANCE_STATUS.PRESENT,
			},
			originalStatus: ATTENDANCE_STATUS.PRESENT,
		},
		{
			id: 's-2',
			name: 'Maria Garcia',
			attendanceRecord: {
				id: 'rec-2',
				studentId: 's-2',
				studentName: 'Maria Garcia',
				status: ATTENDANCE_STATUS.ABSENT,
			},
			originalStatus: ATTENDANCE_STATUS.ABSENT,
		},
	];

	it('renders loading skeletons when isLoading is true', () => {
		const { container } = render(
			<AttendanceGrid students={[]} onStatusChange={vi.fn()} isLoading={true} />,
		);

		// Skeletons are rendered inside CardContent
		const skeletons = container.querySelectorAll('.animate-pulse');
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it('renders empty state when students array is empty', () => {
		render(
			<AttendanceGrid students={[]} onStatusChange={vi.fn()} isLoading={false} />,
		);

		expect(screen.getByText('Sin alumnos en el curso')).toBeInTheDocument();
		expect(
			screen.getByText(
				'No hay estudiantes registrados o matriculados para este curso.',
			),
		).toBeInTheDocument();
	});

	it('renders student rows correctly', () => {
		render(<AttendanceGrid students={mockStudents} onStatusChange={vi.fn()} />);

		expect(screen.getByText('Juan Perez')).toBeInTheDocument();
		expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
		expect(screen.getByText('Alumno')).toBeInTheDocument();
		expect(screen.getByText('Estado de Asistencia')).toBeInTheDocument();
	});

	it('displays pending change indicator when status changed and hasPendingChanges is true (optimistic update)', () => {
		const firstRecord = mockStudents[0]?.attendanceRecord;
		const modifiedStudents: StudentRowItem[] = [
			{
				id: 's-1',
				name: 'Juan Perez',
				attendanceRecord: firstRecord
					? { ...firstRecord, status: ATTENDANCE_STATUS.ABSENT }
					: undefined,
				originalStatus: ATTENDANCE_STATUS.PRESENT,
			},
		];

		const { container } = render(
			<AttendanceGrid
				students={modifiedStudents}
				onStatusChange={vi.fn()}
				hasPendingChanges={true}
			/>,
		);

		// The pending indicator is a dot with title "Cambio pendiente"
		const pendingDot = container.querySelector('span[title="Cambio pendiente"]');
		expect(pendingDot).toBeInTheDocument();
	});

	it('does not display pending indicator when status is reverted (rollback)', () => {
		const firstRecord = mockStudents[0]?.attendanceRecord;
		const revertedStudents: StudentRowItem[] = [
			{
				id: 's-1',
				name: 'Juan Perez',
				attendanceRecord: firstRecord
					? { ...firstRecord, status: ATTENDANCE_STATUS.PRESENT }
					: undefined,
				originalStatus: ATTENDANCE_STATUS.PRESENT,
			},
		];

		const { container } = render(
			<AttendanceGrid
				students={revertedStudents}
				onStatusChange={vi.fn()}
				hasPendingChanges={true}
			/>,
		);

		const pendingDot = container.querySelector('span[title="Cambio pendiente"]');
		expect(pendingDot).not.toBeInTheDocument();
	});

	it('allows triggering justification modal for absent/late records', () => {
		const onJustify = vi.fn();
		render(
			<AttendanceGrid
				students={mockStudents}
				onStatusChange={vi.fn()}
				onJustify={onJustify}
			/>,
		);

		// Second student is absent and has record id, so Justificar button should show
		const justifyBtn = screen.getByRole('button', { name: /justificar/i });
		expect(justifyBtn).toBeInTheDocument();

		fireEvent.click(justifyBtn);
		const secondRecord = mockStudents[1]?.attendanceRecord;
		expect(onJustify).toHaveBeenCalledWith(secondRecord);
	});
});
