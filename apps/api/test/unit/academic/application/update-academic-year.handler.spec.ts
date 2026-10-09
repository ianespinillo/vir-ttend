import { NotFoundException } from '@nestjs/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { UpdateAcademicYearCommand } from '../../../../src/modules/academic/application/commands/update-academic-year/update-academic-year.command';
import { UpdateAcademicYearHandler } from '../../../../src/modules/academic/application/commands/update-academic-year/update-academic-year.handler';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { IAcademicYearRepository } from '../../../../src/modules/academic/domain/repositories/academic-year.repository.interface';

describe('UpdateAcademicYearHandler', () => {
	let handler: UpdateAcademicYearHandler;
	let academicYearRepository: MockProxy<IAcademicYearRepository>;

	beforeEach(() => {
		academicYearRepository = mock<IAcademicYearRepository>();
		handler = new UpdateAcademicYearHandler(academicYearRepository);
	});

	it('should throw NotFoundException when academic year does not exist', async () => {
		academicYearRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(
				new UpdateAcademicYearCommand('non-existent', {
					absenceThresholdPercent: 20,
				}),
			),
		).rejects.toThrow(NotFoundException);
	});

	it('should update dates, thresholds and isActive when provided', async () => {
		const period = AcademicYear.reconstitute({
			id: 'ay-1',
			tenantId: 'tenant-1',
			year: 2026,
			startDate: new Date('2026-03-01'),
			endDate: new Date('2026-12-15'),
			nonWorkingDays: [],
			absenceThresholdPercent: 15,
			lateCountAbscenseAfterMinutes: 15,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		academicYearRepository.findById.mockResolvedValue(period);

		const result = await handler.execute(
			new UpdateAcademicYearCommand(
				'ay-1',
				{
					absenceThresholdPercent: 20,
					lateCountAbscenseAfterMinutes: 10,
				},
				[new Date('2026-07-09')],
				2026,
				new Date('2026-03-10'),
				new Date('2026-12-20'),
				false,
			),
		);

		expect(academicYearRepository.save).toHaveBeenCalledTimes(1);
		expect(result.isActive).toBe(false);
		expect(result.absenceThresholdPercent).toBe(20);
		expect(result.lateCountAbscenseAfterMinutes).toBe(10);
		expect(result.startDate).toEqual(new Date('2026-03-10'));
		expect(result.endDate).toEqual(new Date('2026-12-20'));
		expect(result.nonWorkingDays).toHaveLength(1);
	});

	it('should activate period when isActive is true', async () => {
		const period = AcademicYear.reconstitute({
			id: 'ay-2',
			tenantId: 'tenant-1',
			year: 2026,
			startDate: new Date('2026-03-01'),
			endDate: new Date('2026-12-15'),
			nonWorkingDays: [],
			absenceThresholdPercent: 15,
			lateCountAbscenseAfterMinutes: 15,
			isActive: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		academicYearRepository.findById.mockResolvedValue(period);

		const result = await handler.execute(
			new UpdateAcademicYearCommand(
				'ay-2',
				{},
				undefined,
				undefined,
				undefined,
				undefined,
				true,
			),
		);

		expect(academicYearRepository.save).toHaveBeenCalledTimes(1);
		expect(result.isActive).toBe(true);
	});
});
