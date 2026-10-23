import { ATTENDANCE_STATUS, type AttendanceStatus } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttendanceGrid } from './attendance-grid';
import type { StudentRowItem } from './attendance-row';

function student(
	id: string,
	status: AttendanceStatus,
	overrides: Partial<StudentRowItem> = {},
	recordId = `rec-${id}`,
): StudentRowItem {
	return {
		id,
		name: `Alumno ${id}`,
		attendanceRecord: {
			id: recordId,
			studentId: id,
			studentName: `Alumno ${id}`,
			status,
		},
		originalStatus: status,
		...overrides,
	};
}

const students: StudentRowItem[] = [
	student('a', ATTENDANCE_STATUS.ABSENT),
	student('b', ATTENDANCE_STATUS.LATE),
	student('c', ATTENDANCE_STATUS.PRESENT),
	student('d', ATTENDANCE_STATUS.ABSENT, {}, ''),
	student('e', ATTENDANCE_STATUS.ABSENT, {
		attendanceRecord: {
			id: 'rec-e',
			studentId: 'e',
			studentName: 'Alumno e',
			status: ATTENDANCE_STATUS.ABSENT,
			justification: {
				id: 'j-1',
				reason: 'Enfermedad',
				createdBy: 'u-1',
				createdAt: new Date('2026-03-10T10:00:00.000Z'),
			},
		},
	}),
	student('f', ATTENDANCE_STATUS.ABSENT, {
		originalStatus: ATTENDANCE_STATUS.PRESENT,
	}),
];

describe('AttendanceGrid bulk selection', () => {
	it('renders no checkboxes when the selection props are absent', () => {
		render(<AttendanceGrid students={students} onStatusChange={vi.fn()} />);
		expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
	});

	it('offers a checkbox only for saved, unjustified, unchanged absent or late rows', () => {
		render(
			<AttendanceGrid
				students={students}
				onStatusChange={vi.fn()}
				selectedRecordIds={new Set()}
				onToggleSelect={vi.fn()}
				onToggleSelectAll={vi.fn()}
			/>,
		);
		expect(screen.getByLabelText('Seleccionar a Alumno a')).toBeInTheDocument();
		expect(screen.getByLabelText('Seleccionar a Alumno b')).toBeInTheDocument();
		for (const id of ['c', 'd', 'e', 'f']) {
			expect(screen.queryByLabelText(`Seleccionar a Alumno ${id}`)).toBeNull();
		}
		// two row checkboxes plus the header one
		expect(screen.getAllByRole('checkbox')).toHaveLength(3);
	});

	it('notifies the toggled record id and reflects the selection', () => {
		const onToggleSelect = vi.fn();
		render(
			<AttendanceGrid
				students={students}
				onStatusChange={vi.fn()}
				selectedRecordIds={new Set(['rec-a'])}
				onToggleSelect={onToggleSelect}
			/>,
		);
		expect(screen.getByLabelText('Seleccionar a Alumno a')).toBeChecked();
		expect(screen.getByLabelText('Seleccionar a Alumno b')).not.toBeChecked();
		fireEvent.click(screen.getByLabelText('Seleccionar a Alumno b'));
		expect(onToggleSelect).toHaveBeenCalledWith('rec-b');
	});

	it('header checkbox selects every justifiable row', () => {
		const onToggleSelectAll = vi.fn();
		render(
			<AttendanceGrid
				students={students}
				onStatusChange={vi.fn()}
				selectedRecordIds={new Set(['rec-a'])}
				onToggleSelect={vi.fn()}
				onToggleSelectAll={onToggleSelectAll}
			/>,
		);
		fireEvent.click(screen.getByLabelText('Seleccionar todos los justificables'));
		expect(onToggleSelectAll).toHaveBeenCalledWith(['rec-a', 'rec-b'], true);
	});

	it('header checkbox deselects when all justifiable rows are selected', () => {
		const onToggleSelectAll = vi.fn();
		render(
			<AttendanceGrid
				students={students}
				onStatusChange={vi.fn()}
				selectedRecordIds={new Set(['rec-a', 'rec-b'])}
				onToggleSelect={vi.fn()}
				onToggleSelectAll={onToggleSelectAll}
			/>,
		);
		const header = screen.getByLabelText('Seleccionar todos los justificables');
		expect(header).toBeChecked();
		fireEvent.click(header);
		expect(onToggleSelectAll).toHaveBeenCalledWith(['rec-a', 'rec-b'], false);
	});
});
