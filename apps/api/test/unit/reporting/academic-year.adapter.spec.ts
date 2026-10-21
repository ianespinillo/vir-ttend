import { SHIFT } from '@repo/common';
import { mock } from 'jest-mock-extended';
import { AcademicYear } from '../../../src/modules/academic/domain/entities/academic-year.entity';
import { IAcademicYearRepository } from '../../../src/modules/academic/domain/repositories/academic-year.repository.interface';
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
	const adapter = new AcademicYearAdapter(repo);
	const totalDays = 30;

	beforeEach(() => {
		repo.findById.mockResolvedValue(year);
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
