import { type ICourseResponse, LEVEL, SHIFT } from '@repo/common';
import { render, screen } from '@testing-library/react';
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
