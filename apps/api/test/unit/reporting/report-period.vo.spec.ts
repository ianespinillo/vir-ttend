import { DomainError } from '../../../src/common/errors';
import { ReportPeriod } from '../../../src/modules/reporting/domain/value-objects/report-period.vo';

describe('ReportPeriod', () => {
	const currentYear = new Date().getFullYear();

	it.each([0, 13])('rejects month %i as invalid input', (month) => {
		expect(() => ReportPeriod.generate(month, currentYear)).toThrow(DomainError);
		expect(() => ReportPeriod.generate(month, currentYear)).toThrow(
			'El mes debe ser un número entero entre 1 y 12',
		);
	});

	it('rejects a past year as invalid input', () => {
		expect(() => ReportPeriod.generate(5, currentYear - 1)).toThrow(DomainError);
		expect(() => ReportPeriod.generate(5, currentYear - 1)).toThrow(
			'No se puede generar un reporte de un año anterior',
		);
	});

	it('rejects a future year as invalid input', () => {
		expect(() => ReportPeriod.generate(5, currentYear + 1)).toThrow(DomainError);
		expect(() => ReportPeriod.generate(5, currentYear + 1)).toThrow(
			'No se puede generar un reporte de un año futuro',
		);
	});

	it('accepts a month of the current year', () => {
		const period = ReportPeriod.generate(5, currentYear);
		expect(period.month).toBe(5);
		expect(period.year).toBe(currentYear);
	});
});
