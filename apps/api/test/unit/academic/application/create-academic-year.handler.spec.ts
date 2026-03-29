import { EventEmitter2 } from '@nestjs/event-emitter';
// create-academic-year.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { CreateAcademicYearCommand } from '../../../../src/modules/academic/application/commands/create-academic-year/create-academic-year.command';
import { CreateAcademicYearHandler } from '../../../../src/modules/academic/application/commands/create-academic-year/create-academic-year.handler';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { IAcademicYearRepository } from '../../../../src/modules/academic/domain/repositories/academic-year.repository.interface';
import { AcademicYearCreatedEvent } from '../../../../src/modules/academic/events/academic-year-created.event';

describe('CreateAcademicYearHandler', () => {
	let handler: CreateAcademicYearHandler;
	let academicYearRepository: MockProxy<IAcademicYearRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;

	beforeEach(() => {
		academicYearRepository = mock<IAcademicYearRepository>();
		eventEmitter = mock<EventEmitter2>();

		handler = new CreateAcademicYearHandler(academicYearRepository, eventEmitter);
	});

	it('should create academic year when it does not exist for tenant and year', async () => {
		academicYearRepository.findBySchoolAndYear.mockResolvedValue(null);

		const result = await handler.execute(
			new CreateAcademicYearCommand(
				'tenant-id',
				2025,
				new Date('2025-03-01'),
				new Date('2025-12-31'),
				[],
				75,
				15,
			),
		);

		expect(academicYearRepository.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'academic-year.created',
			expect.any(AcademicYearCreatedEvent),
		);
		expect(result.year).toBe(2025);
		expect(result.isActive).toBe(true);
	});

	it('should throw when academic year already exists for tenant and year', async () => {
		academicYearRepository.findBySchoolAndYear.mockResolvedValue(
			AcademicYear.reconstitute({
				id: 'ay-1',
				tenantId: 'tenant-id',
				year: 2025,
				startDate: new Date('2025-03-01'),
				endDate: new Date('2025-12-31'),
				nonWorkingDays: [],
				absenceThresholdPercent: 75,
				lateCountAbscenseAfterMinutes: 15,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		await expect(
			handler.execute(
				new CreateAcademicYearCommand(
					'tenant-id',
					2025,
					new Date('2025-03-01'),
					new Date('2025-12-31'),
					[],
					75,
					15,
				),
			),
		).rejects.toThrow();

		expect(academicYearRepository.save).not.toHaveBeenCalled();
	});

	it('should use default thresholds when not provided', async () => {
		academicYearRepository.findBySchoolAndYear.mockResolvedValue(null);

		const result = await handler.execute(
			new CreateAcademicYearCommand(
				'tenant-id',
				2025,
				new Date('2025-03-01'),
				new Date('2025-12-31'),
				[],
				75,
				15,
			),
		);

		expect(result.absenceThresholdPercent).toBe(75);
		expect(result.lateCountAbscenseAfterMinutes).toBe(15);
	});
});
