import { COURSE_RISK_STATUS, type CourseSnapshot, LEVEL } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CourseStatusCard } from './course-status-card';

const snapshot = (overrides: Partial<CourseSnapshot> = {}): CourseSnapshot => ({
	courseId: 'c-1',
	courseName: '6° A',
	level: LEVEL.SECONDARY,
	totalStudents: 20,
	present: 18,
	absent: 2,
	late: 0,
	justified: 0,
	notRecorded: 0,
	absencePercent: 10,
	attendancePercent: 90,
	statusColor: COURSE_RISK_STATUS.OK,
	lastUpdated: new Date('2026-03-10'),
	...overrides,
});

describe('CourseStatusCard', () => {
	it('opens the daily attendance of a regular course on click', () => {
		const onClick = vi.fn();
		render(<CourseStatusCard course={snapshot()} onClick={onClick} />);
		fireEvent.click(screen.getByText('6° A'));
		expect(onClick).toHaveBeenCalledWith('c-1');
	});

	it('offers no daily attendance shortcut for a workshop-only course', () => {
		const onClick = vi.fn();
		render(
			<CourseStatusCard
				course={snapshot({ courseName: '7° A', workshopOnly: true })}
				onClick={onClick}
			/>,
		);
		fireEvent.click(screen.getByText('7° A'));
		expect(onClick).not.toHaveBeenCalled();
		expect(screen.getByText(/solo taller/i)).toBeInTheDocument();
	});
});
