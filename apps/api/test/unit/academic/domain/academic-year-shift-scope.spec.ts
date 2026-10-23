import { SHIFT } from '@repo/common';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';

const day = new Date('2026-05-15T00:00:00.000Z');
const otherDay = new Date('2026-05-18T00:00:00.000Z');

const makeYear = () =>
	AcademicYear.create({
		tenantId: 'tenant-1',
		year: 2026,
		startDate: new Date('2026-03-01T00:00:00.000Z'),
		endDate: new Date('2026-12-18T00:00:00.000Z'),
		nonWorkingDays: [],
	});

describe('AcademicYear shift-scoped non-working days', () => {
	it('suspends every shift when no scope is given', () => {
		const year = makeYear();
		year.declareNonWorkingDay(day);

		expect(year.nonWorkingDayShifts).toEqual({});
		for (const shift of Object.values(SHIFT)) {
			expect(year.isNonWorkingDayFor(day, shift)).toBe(true);
		}
	});

	it('treats an empty scope as the whole day', () => {
		const year = makeYear();
		year.declareNonWorkingDay(day, []);

		expect(year.nonWorkingDayShifts).toEqual({});
		expect(year.isNonWorkingDayFor(day, SHIFT.EVENING)).toBe(true);
	});

	it('only suspends the listed shifts when scoped', () => {
		const year = makeYear();
		year.declareNonWorkingDay(day, [SHIFT.MORNING, SHIFT.MORNING]);

		expect(year.nonWorkingDayShifts).toEqual({ '2026-05-15': [SHIFT.MORNING] });
		expect(year.isNonWorkingDayFor(day, SHIFT.MORNING)).toBe(true);
		expect(year.isNonWorkingDayFor(day, SHIFT.AFTERNOON)).toBe(false);
		// Without a course shift any suspension of the day counts.
		expect(year.isNonWorkingDayFor(day)).toBe(true);
	});

	it('is not a non-working day for undeclared dates', () => {
		const year = makeYear();
		year.declareNonWorkingDay(day, [SHIFT.MORNING]);

		expect(year.isNonWorkingDayFor(otherDay, SHIFT.MORNING)).toBe(false);
	});

	it('replaces the scope when the same day is declared again', () => {
		const year = makeYear();
		year.declareNonWorkingDay(day, [SHIFT.MORNING]);
		year.declareNonWorkingDay(day, [SHIFT.AFTERNOON]);
		expect(year.nonWorkingDays).toHaveLength(1);
		expect(year.nonWorkingDayShifts).toEqual({
			'2026-05-15': [SHIFT.AFTERNOON],
		});

		year.declareNonWorkingDay(day);
		expect(year.nonWorkingDays).toHaveLength(1);
		expect(year.nonWorkingDayShifts).toEqual({});
	});

	it('keeps the scope when the day is re-added without one', () => {
		const year = makeYear();
		year.declareNonWorkingDay(day, [SHIFT.MORNING]);
		year.addNonWorkingDay(day);

		expect(year.nonWorkingDayShifts).toEqual({ '2026-05-15': [SHIFT.MORNING] });
	});

	it('drops the scope when the day is removed', () => {
		const year = makeYear();
		year.declareNonWorkingDay(day, [SHIFT.MORNING]);
		year.removeNonWorkingDay(day);

		expect(year.nonWorkingDays).toHaveLength(0);
		expect(year.nonWorkingDayShifts).toEqual({});
	});

	it('reconstitutes legacy rows without a scope as whole-day suspensions', () => {
		const year = AcademicYear.reconstitute({
			id: 'ay-1',
			tenantId: 'tenant-1',
			year: 2026,
			startDate: new Date('2026-03-01T00:00:00.000Z'),
			endDate: new Date('2026-12-18T00:00:00.000Z'),
			nonWorkingDays: [day],
			absenceThresholdPercent: 20,
			lateCountAbscenseAfterMinutes: 15,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		expect(year.nonWorkingDayShifts).toEqual({});
		expect(year.isNonWorkingDayFor(day, SHIFT.EVENING)).toBe(true);
	});
});
