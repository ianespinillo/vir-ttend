import type { Alert } from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertItem } from './alert-item';

const alert = (absenceCount: number): Alert => ({
	id: 'alert-1',
	studentId: 'student-1',
	studentName: 'Ana Pérez',
	courseId: 'course-1',
	courseName: '1° A',
	alertType: 'warning',
	absenceCount,
	threshold: 10,
	seenAt: null,
	createdAt: new Date('2026-03-10T12:00:00.000Z'),
});

describe('AlertItem', () => {
	it('muestra las faltas con coma decimal', () => {
		render(<AlertItem alert={alert(12.5)} />);

		expect(screen.getByText('12,5 faltas')).toBeTruthy();
	});

	it('muestra un entero sin decimales', () => {
		render(<AlertItem alert={alert(10)} />);

		expect(screen.getByText('10 faltas')).toBeTruthy();
	});
});
