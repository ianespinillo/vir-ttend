import { EventEmitter2 } from '@nestjs/event-emitter';
// create-course.handler.spec.ts
import { LEVEL, SHIFT } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { CreateCourseCommand } from '../../../../src/modules/academic/application/commands/create-course/create-course.command';
import { CreateCourseHandler } from '../../../../src/modules/academic/application/commands/create-course/create-course.handler';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { IAcademicYearRepository } from '../../../../src/modules/academic/domain/repositories/academic-year.repository.interface';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { CourseCreatedEvent } from '../../../../src/modules/academic/events/course-created.event';

describe('CreateCourseHandler', () => {
	let handler: CreateCourseHandler;
	let courseRepository: MockProxy<ICourseRepository>;
	let academicYearRepository: MockProxy<IAcademicYearRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const mockAcademicYear = AcademicYear.reconstitute({
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
	});

	beforeEach(() => {
		courseRepository = mock<ICourseRepository>();
		academicYearRepository = mock<IAcademicYearRepository>();
		eventEmitter = mock<EventEmitter2>();

		handler = new CreateCourseHandler(
			academicYearRepository,
			courseRepository,
			eventEmitter,
		);
	});

	it('should create course when it does not exist', async () => {
		academicYearRepository.findById.mockResolvedValue(mockAcademicYear);
		courseRepository.findByAcademicYearAndDivision.mockResolvedValue(null);

		const result = await handler.execute(
			new CreateCourseCommand(
				'tenant-id',
				'ay-1',
				LEVEL.PRIMARY,
				SHIFT.MORNING,
				3,
				'A',
				'preceptor-id',
			),
		);

		expect(courseRepository.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'course.created',
			expect.any(CourseCreatedEvent),
		);
		expect(result.yearNumber).toBe(3);
		expect(result.division).toBe('A');
	});

	it('should throw when academic year does not exist', async () => {
		academicYearRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(
				new CreateCourseCommand(
					'tenant-id',
					'ay-1',
					LEVEL.PRIMARY,
					SHIFT.MORNING,
					3,
					'A',
					'preceptor-id',
				),
			),
		).rejects.toThrow();

		expect(courseRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when academic year is inactive', async () => {
		academicYearRepository.findById.mockResolvedValue(
			AcademicYear.reconstitute({
				...mockAcademicYear,
				id: 'ay-1',
				tenantId: 'tenant-id',
				year: 2025,
				startDate: new Date('2025-03-01'),
				endDate: new Date('2025-12-31'),
				nonWorkingDays: [],
				absenceThresholdPercent: 75,
				lateCountAbscenseAfterMinutes: 15,
				isActive: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		await expect(
			handler.execute(
				new CreateCourseCommand(
					'tenant-id',
					'ay-1',
					LEVEL.PRIMARY,
					SHIFT.MORNING,
					3,
					'A',
					'preceptor-id',
				),
			),
		).rejects.toThrow();

		expect(courseRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when course already exists for same year and division', async () => {
		academicYearRepository.findById.mockResolvedValue(mockAcademicYear);
		courseRepository.findByAcademicYearAndDivision.mockResolvedValue(
			Course.reconstitute({
				id: 'course-1',
				tenantId: 'tenant-id',
				academicYearId: 'ay-1',
				preceptorId: 'preceptor-id',
				level: LEVEL.PRIMARY,
				yearNumber: 3,
				division: 'A',
				shift: SHIFT.MORNING,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		await expect(
			handler.execute(
				new CreateCourseCommand(
					'tenant-id',
					'ay-1',
					LEVEL.PRIMARY,
					SHIFT.MORNING,
					3,
					'A',
					'preceptor-id',
				),
			),
		).rejects.toThrow();

		expect(courseRepository.save).not.toHaveBeenCalled();
	});
});
