import { describe, expect, it } from 'vitest';
import {
	STANDARD_NATIONAL_HOLIDAYS,
	getHolidayName,
	getStandardNationalHolidays,
} from './holidays.constants.js';

describe('holidays.constants', () => {
	it('returns standard holidays for 2026 including Carnaval and Viernes Santo', () => {
		const holidays2026 = getStandardNationalHolidays(2026);
		expect(holidays2026).toHaveLength(14);
		expect(holidays2026).toContain('2026-01-01');
		expect(holidays2026).toContain('2026-02-16');
		expect(holidays2026).toContain('2026-03-24');
		expect(holidays2026).toContain('2026-04-02');
		expect(holidays2026).toContain('2026-04-03');
		expect(holidays2026).toContain('2026-05-25');
		expect(holidays2026).toContain('2026-07-09');
		expect(holidays2026).toContain('2026-12-25');
	});

	it('returns standard fixed holidays for any other year', () => {
		const holidays2025 = getStandardNationalHolidays(2025);
		expect(holidays2025).toHaveLength(STANDARD_NATIONAL_HOLIDAYS.length);
		expect(holidays2025).toContain('2025-05-25');
		expect(holidays2025).toContain('2025-07-09');
	});

	it('resolves holiday name correctly', () => {
		expect(getHolidayName('2026-05-25')).toBe('Día de la Revolución de Mayo');
		expect(getHolidayName('2026-02-16')).toBe('Carnaval');
		expect(getHolidayName('2026-07-09')).toBe('Día de la Independencia');
		expect(getHolidayName('2026-08-10')).toBeUndefined();
	});
});
