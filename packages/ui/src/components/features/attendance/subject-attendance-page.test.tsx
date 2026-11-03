import {
	type ISubjectResponse,
	WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE,
} from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	SubjectAttendancePage,
	type SubjectAttendancePageProps,
	filterSubjectsWithAttendance,
} from './subject-attendance-page';

const subject = (
	id: string,
	hasSubjectAttendance?: boolean,
): ISubjectResponse => ({
	id,
	name: `Materia ${id}`,
	area: 'Area',
	weeklyHours: 2,
	hasSubjectAttendance,
});

const regular = subject('s-1', true);
const legacy = subject('s-2');
const workshopShiftTheory = subject('s-3', false);

function renderPage(overrides: Partial<SubjectAttendancePageProps> = {}) {
	const props: SubjectAttendancePageProps = {
		subjects: [regular, legacy, workshopShiftTheory],
		gridStudents: [],
		metrics: null,
		selectedSubjectId: '',
		selectedDate: '2026-03-10',
		isClassDay: true,
		isLoadingSubjects: false,
		isLoadingAttendance: false,
		isSaving: false,
		isBulkSaving: false,
		onSubjectChange: vi.fn(),
		onDateChange: vi.fn(),
		onStatusChange: vi.fn(),
		onMarkAll: vi.fn(),
		isCopyOpen: false,
		onOpenCopy: vi.fn(),
		onCloseCopy: vi.fn(),
		onConfirmCopy: vi.fn(),
		isSubmittingCopy: false,
		isJustifyOpen: false,
		selectedRecordToJustify: null,
		onJustify: vi.fn(),
		onCloseJustify: vi.fn(),
		onConfirmJustify: vi.fn(),
		isSubmittingJustify: false,
		...overrides,
	};
	return render(<SubjectAttendancePage {...props} />);
}

describe('filterSubjectsWithAttendance', () => {
	it('leaves out subjects without own attendance and keeps a missing flag', () => {
		expect(
			filterSubjectsWithAttendance([regular, legacy, workshopShiftTheory]),
		).toEqual([regular, legacy]);
	});
});

describe('SubjectAttendancePage', () => {
	it('explains that a workshop-shift theory subject has no own attendance', () => {
		renderPage({ selectedSubjectId: 's-3' });
		expect(
			screen.getByText(WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE),
		).toBeTruthy();
	});

	it('shows no notice for a regular subject', () => {
		renderPage({ selectedSubjectId: 's-1' });
		expect(
			screen.queryByText(WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE),
		).toBeNull();
	});
});
