import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StudentCourseComparisonChart } from './student-course-comparison-chart';

describe('StudentCourseComparisonChart', () => {
	it('muestra el título y el vacío cuando no hay meses', () => {
		render(<StudentCourseComparisonChart studentMonths={[]} courseMonths={[]} />);

		expect(screen.getByText('Alumno vs. curso')).toBeTruthy();
		expect(screen.getByText('Aún no hay meses comparables')).toBeTruthy();
	});
});
