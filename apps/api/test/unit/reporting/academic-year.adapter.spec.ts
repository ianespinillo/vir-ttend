import { SHIFT } from '@repo/common';
import { mock } from 'jest-mock-extended';
import { AcademicYear } from '../../../src/modules/academic/domain/entities/academic-year.entity';
import { IAcademicYearRepository } from '../../../src/modules/academic/domain/repositories/academic-year.repository.interface';
import { DailySessionNotHeld } from '../../../src/modules/attendance/domain/entities/daily-session-not-held.entity';
import { IDailySessionNotHeldRepository } from '../../../src/modules/attendance/domain/repositories/daily-session-not-held.repository.interface';
import { AcademicYearAdapter } from '../../../src/modules/reporting/infrastructure/adapters/academic-year.adapter';

describe('Reporting AcademicYearAdapter.getWorkingDaysBYAcademicYear', () => {
	const year = AcademicYear.reconstitute({
		id: 'ay-1',
		tenantId: 'tenant-1',
		year: 2026,
		startDate: new Date('2026-03-01T00:00:00.000Z'),
		endDate: new Date('2026-03-31T00:00:00.000Z'),
		nonWorkingDays: [
			new Date('2026-03-10T00:00:00.000Z'),
			new Date('2026-03-11T00:00:00.000Z'),
		],
		nonWorkingDayShifts: { '2026-03-10': [SHIFT.MORNING] },
		absenceThresholdPercent: 20,
		lateCountAbscenseAfterMinutes: 15,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	const repo = mock<IAcademicYearRepository>();
	const notHeldRepo = mock<IDailySessionNotHeldRepository>();
	const adapter = new AcademicYearAdapter(repo, notHeldRepo);
	const totalDays = 30;
	const marker = (day: string) =>
		DailySessionNotHeld.create({
			tenantId: 'tenant-1',
			courseId: 'course-1',
			date: new Date(`${day}T00:00:00.000Z`),
			createdBy: 'user-1',
		});

	beforeEach(() => {
		repo.findById.mockResolvedValue(year);
		notHeldRepo.findByCourseAndDateRange.mockResolvedValue([]);
	});

	describe('with the theory not held markers of a course', () => {
		it('subtracts each marked day', async () => {
			notHeldRepo.findByCourseAndDateRange.mockResolvedValue([
				marker('2026-03-04'),
				marker('2026-03-05'),
			]);

			await expect(
				adapter.getWorkingDaysBYAcademicYear('ay-1', SHIFT.AFTERNOON, 'course-1'),
			).resolves.toBe(totalDays - 1 - 2);
			expect(notHeldRepo.findByCourseAndDateRange).toHaveBeenCalledWith(
				'course-1',
				year.startDate,
				year.endDate,
			);
		});

		it('does not subtract a marked day that is already a non-working day of the shift', async () => {
			notHeldRepo.findByCourseAndDateRange.mockResolvedValue([
				marker('2026-03-10'),
				marker('2026-03-11'),
			]);

			// 03-10 is scoped to the morning shift: suspended, so not subtracted again.
			await expect(
				adapter.getWorkingDaysBYAcademicYear('ay-1', SHIFT.MORNING, 'course-1'),
			).resolves.toBe(totalDays - 2);
		});

		it('subtracts a marked day whose institutional suspension covers another shift', async () => {
			notHeldRepo.findByCourseAndDateRange.mockResolvedValue([
				marker('2026-03-10'),
			]);

			// The afternoon works on 03-10, so its marker is a day lost on top of 03-11.
			await expect(
				adapter.getWorkingDaysBYAcademicYear('ay-1', SHIFT.AFTERNOON, 'course-1'),
			).resolves.toBe(totalDays - 1 - 1);
		});

		it('ignores the markers when no course is given', async () => {
			notHeldRepo.findByCourseAndDateRange.mockClear();
			await adapter.getWorkingDaysBYAcademicYear('ay-1', SHIFT.AFTERNOON);

			expect(notHeldRepo.findByCourseAndDateRange).not.toHaveBeenCalled();
		});
	});

	describe('getNonWorkingDays', () => {
		const from = new Date('2026-03-01T00:00:00.000Z');
		const to = new Date('2026-03-31T00:00:00.000Z');

		it('lists the suspensions that cover the shift', async () => {
			await expect(
				adapter.getNonWorkingDays('ay-1', SHIFT.AFTERNOON, from, to),
			).resolves.toEqual(['2026-03-11']);
			await expect(
				adapter.getNonWorkingDays('ay-1', SHIFT.MORNING, from, to),
			).resolves.toEqual(['2026-03-10', '2026-03-11']);
		});

		it('keeps only the days inside the range', async () => {
			await expect(
				adapter.getNonWorkingDays(
					'ay-1',
					SHIFT.MORNING,
					new Date('2026-03-11T00:00:00.000Z'),
					to,
				),
			).resolves.toEqual(['2026-03-11']);
		});

		it('is empty for an unknown academic year', async () => {
			repo.findById.mockResolvedValue(null);

			await expect(
				adapter.getNonWorkingDays('nope', SHIFT.MORNING, from, to),
			).resolves.toEqual([]);
		});
	});

	it('subtracts every declared day when the course shift is unknown', async () => {
		await expect(adapter.getWorkingDaysBYAcademicYear('ay-1')).resolves.toBe(
			totalDays - 2,
		);
	});

	it('subtracts a scoped day only for courses of an affected shift', async () => {
		await expect(
			adapter.getWorkingDaysBYAcademicYear('ay-1', SHIFT.MORNING),
		).resolves.toBe(totalDays - 2);
		await expect(
			adapter.getWorkingDaysBYAcademicYear('ay-1', SHIFT.AFTERNOON),
		).resolves.toBe(totalDays - 1);
	});
});
