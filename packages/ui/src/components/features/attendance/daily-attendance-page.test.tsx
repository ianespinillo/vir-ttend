import { type ICourseResponse, LEVEL, SHIFT } from '@repo/common';
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
