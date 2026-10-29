import { SHIFT } from '@repo/common';
import { AcademicYear } from '../../../src/modules/academic/domain/entities/academic-year.entity';
import { AcademicYearAdapter } from '../../../src/modules/attendance/infrastructure/adapters/academic-year.adapter';

const utc = (day: string) => new Date(`${day}T00:00:00.000Z`);

describe('Attendance AcademicYearAdapter.getNonWorkingDays', () => {
	const year = AcademicYear.reconstitute({
		id: 'ay-1',
		tenantId: 'tenant-1',
		year: 2026,
		startDate: utc('2026-03-01'),
		endDate: utc('2026-12-18'),
		nonWorkingDays: [utc('2026-03-10'), utc('2026-03-11'), utc('2026-05-25')],
		nonWorkingDayShifts: { '2026-03-10': [SHIFT.MORNING] },
		absenceThresholdPercent: 20,
		lateCountAbscenseAfterMinutes: 15,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	const academicYearRepo = { findById: jest.fn() };
	const adapter = new AcademicYearAdapter(
		academicYearRepo as never,
		{} as never,
	);

	beforeEach(() => {
		academicYearRepo.findById.mockResolvedValue(year);
	});

	it('lists the suspensions that cover the shift inside the range', async () => {
		await expect(
			adapter.getNonWorkingDays(
				'ay-1',
				SHIFT.MORNING,
				utc('2026-03-01'),
				utc('2026-03-31'),
			),
		).resolves.toEqual(['2026-03-10', '2026-03-11']);
		await expect(
			adapter.getNonWorkingDays(
				'ay-1',
				SHIFT.AFTERNOON,
				utc('2026-03-01'),
				utc('2026-03-31'),
			),
		).resolves.toEqual(['2026-03-11']);
	});

	it('counts any suspension when the shift is unknown', async () => {
		await expect(
			adapter.getNonWorkingDays(
				'ay-1',
				undefined,
				utc('2026-03-01'),
				utc('2026-03-31'),
			),
		).resolves.toEqual(['2026-03-10', '2026-03-11']);
	});

	it('leaves out the days outside the range, ends included', async () => {
		await expect(
			adapter.getNonWorkingDays(
				'ay-1',
				SHIFT.MORNING,
				utc('2026-03-11'),
				utc('2026-05-25'),
			),
		).resolves.toEqual(['2026-03-11', '2026-05-25']);
	});

	it('is empty for an unknown academic year', async () => {
		academicYearRepo.findById.mockResolvedValue(null);

		await expect(
			adapter.getNonWorkingDays(
				'nope',
				SHIFT.MORNING,
				utc('2026-03-01'),
				utc('2026-03-31'),
			),
		).resolves.toEqual([]);
	});
});
