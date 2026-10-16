import type { MonthlyReportStudent } from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '../../../../ui/tooltip';
import { MonthlyReportTable } from './monthly-report-table';

const student = (
	overrides: Partial<MonthlyReportStudent>,
): MonthlyReportStudent => ({
	studentId: 's1',
	fullName: 'García, Juan',
	documentNumber: '35123456',
	present: 18,
	absent: 12.5,
	late: 2,
	justified: 1,
	absencePercent: 62.5,
	status: 'ok',
	alerts: [],
	...overrides,
});

function renderTable(students: MonthlyReportStudent[]) {
	return render(
		<TooltipProvider>
			<MonthlyReportTable students={students} />
		</TooltipProvider>,
	);
}

describe('MonthlyReportTable', () => {
	it('muestra las inasistencias fraccionarias con coma decimal', () => {
		renderTable([
			student({ studentId: 's1', absent: 12.5 }),
			student({ studentId: 's2', fullName: 'Pérez, Ana', absent: 10.25 }),
			student({ studentId: 's3', fullName: 'López, Carlos', absent: 10 }),
		]);

		expect(screen.getByText('Inasistencias')).toBeTruthy();
		expect(screen.getByText('12,5')).toBeTruthy();
		expect(screen.getByText('10,25')).toBeTruthy();
		expect(screen.getByText('10')).toBeTruthy();
	});

	it('detalla turno y taller en el título de la celda cuando hay desglose', () => {
		renderTable([student({ absenceBreakdown: { daily: 10, workshop: 2.5 } })]);

		expect(screen.getByTitle('Turno: 10 · Taller: 2,5')).toBeTruthy();
	});

	it('muestra un guion en lugar del porcentaje cuando no se dieron clases', () => {
		renderTable([student({ absent: 0, absencePercent: null })]);

		expect(screen.getByText('—')).toBeTruthy();
	});

	it('muestra un guion cuando los valores son NaN', () => {
		renderTable([
			student({
				present: Number.NaN,
				absent: Number.NaN,
				late: Number.NaN,
				justified: Number.NaN,
				absencePercent: Number.NaN,
			}),
		]);

		const dashes = screen.getAllByText('-');
		// present, absent, late, justified, absencePercent should all display '-'
		expect(dashes.length).toBeGreaterThanOrEqual(5);
	});
});
