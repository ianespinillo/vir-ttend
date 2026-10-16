import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportSummaryCards } from './report-summary-cards';

describe('ReportSummaryCards', () => {
	it('normaliza promedio de asistencia cuando viene como ratio 0..1 (ej: 0.7 -> 70.0%)', () => {
		render(
			<ReportSummaryCards
				summary={{
					averageAttendance: 0.7,
					studentsAtRisk: 2,
					studentsExceeded: 1,
				}}
				workingDays={20}
			/>,
		);

		expect(screen.getByText('70.0%')).toBeTruthy();
		expect(screen.getByText('2')).toBeTruthy();
		expect(screen.getByText('1')).toBeTruthy();
		expect(screen.getByText('20')).toBeTruthy();
	});

	it('mantiene porcentajes ya expresados de 0 a 100', () => {
		render(
			<ReportSummaryCards
				summary={{
					averageAttendance: 85.5,
					studentsAtRisk: 0,
					studentsExceeded: 0,
				}}
				workingDays={18}
			/>,
		);

		expect(screen.getByText('85.5%')).toBeTruthy();
	});

	it('muestra guion cuando los valores son NaN', () => {
		render(
			<ReportSummaryCards
				summary={{
					averageAttendance: Number.NaN,
					studentsAtRisk: Number.NaN,
					studentsExceeded: Number.NaN,
				}}
				workingDays={Number.NaN}
			/>,
		);

		const dashes = screen.getAllByText('-');
		// averageAttendance, studentsAtRisk, studentsExceeded, workingDays
		expect(dashes.length).toBe(4);
	});

	it('muestra em-dash cuando summary es null o no tiene asistencia', () => {
		render(<ReportSummaryCards summary={null} workingDays={0} />);

		expect(screen.getByText('—')).toBeTruthy();
	});
});
