import { type ICourseResponse, LEVEL, SHIFT } from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CourseCard } from './course-card';

const course: ICourseResponse = {
	id: 'course-1',
	level: LEVEL.PRIMARY,
	yearNumber: 6,
	division: 'A',
	shift: SHIFT.MORNING,
	fullName: '6° A - Mañana',
	preceptorName: 'Roberto López',
};

describe('CourseCard', () => {
	it('shows the Inactivo badge when the course is inactive', () => {
		render(<CourseCard course={{ ...course, isActive: false }} />);
		expect(screen.getByText('Inactivo')).toBeInTheDocument();
	});

	it('does not show the badge for active or unknown status', () => {
		const { rerender } = render(
			<CourseCard course={{ ...course, isActive: true }} />,
		);
		expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();

		rerender(<CourseCard course={course} />);
		expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();
	});
});
