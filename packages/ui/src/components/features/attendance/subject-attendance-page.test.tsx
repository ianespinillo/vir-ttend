import type { ISubjectResponse } from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	SubjectAttendancePage,
	type SubjectAttendancePageProps,
} from './subject-attendance-page';

const subject: ISubjectResponse = {
	id: 's-1',
	name: 'Materia s-1',
	area: 'Area',
	weeklyHours: 2,
};

function renderPage(overrides: Partial<SubjectAttendancePageProps> = {}) {
	const props: SubjectAttendancePageProps = {
		subjects: [subject],
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
		extraActions: <button type="button">extra-action</button>,
		...overrides,
	};
	return render(<SubjectAttendancePage {...props} />);
}

describe('SubjectAttendancePage', () => {
	it('hides the no-class warning and extra actions until a subject is selected', () => {
		renderPage({ isClassDay: false });
		expect(screen.queryByText(/no tiene clase agendada/)).toBeNull();
		expect(screen.queryByText('extra-action')).toBeNull();
	});

	it('warns about a day without class once a subject is selected', () => {
		renderPage({ selectedSubjectId: 's-1', isClassDay: false });
		expect(screen.getByText(/no tiene clase agendada/)).toBeTruthy();
	});

	it('shows the extra actions for a selected subject', () => {
		renderPage({ selectedSubjectId: 's-1' });
		expect(screen.getByText('extra-action')).toBeTruthy();
	});
});
