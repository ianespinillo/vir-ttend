import { DAYOFWEEK, LEVEL, SHIFT } from '@repo/common';
// set-schedule.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { NotFoundError } from '../../../../src/common/errors';
import { DomainError } from '../../../../src/common/errors/domain.error';
import { SetScheduleCommand } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.command';
import { SetScheduleHandler } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { expectRejection } from '../expect-rejection';

describe('SetScheduleHandler', () => {
	let handler: SetScheduleHandler;
	let scheduleRepository: MockProxy<IScheduleRepository>;
	let subjectRepository: MockProxy<ISubjectRepository>;
	let courseRepository: MockProxy<ICourseRepository>;

	const mockCourse = Course.reconstitute({
		id: 'course-1',
		tenantId: 'tenant-1',
		academicYearId: 'ay-1',
		preceptorId: 'preceptor-1',
		level: LEVEL.SECONDARY,
		yearNumber: 1,
		division: 'A',
		shift: SHIFT.MORNING,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const mockSubject = Subject.reconstitute({
		id: 'sub-1',
		courseId: 'course-1',
		teacherId: 'teacher-1',
		name: 'Matemática',
		area: 'Exactas',
		weeklyHours: 4,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const existingSlots = [
		ScheduleSlot.reconstitute({
			id: 'slot-1',
			subjectId: 'sub-2', // otra materia del mismo curso
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '08:00',
			endTime: '09:00',
			createdAt: new Date(),
		}),
	];

	beforeEach(() => {
		scheduleRepository = mock<IScheduleRepository>();
		subjectRepository = mock<ISubjectRepository>();
		courseRepository = mock<ICourseRepository>();

		handler = new SetScheduleHandler(
			scheduleRepository,
			subjectRepository,
			courseRepository,
		);
	});

	it('should set schedule when no overlap exists', async () => {
		subjectRepository.findById.mockResolvedValue(mockSubject);
		scheduleRepository.findByCourse.mockResolvedValue(existingSlots);

		await handler.execute(
			new SetScheduleCommand('sub-1', [
				{ dayOfWeek: DAYOFWEEK.TUESDAY, startTime: '10:00', endTime: '11:00' },
			]),
		);

		expect(scheduleRepository.deleteBySubject).toHaveBeenCalledWith('sub-1');
		expect(scheduleRepository.saveMany).toHaveBeenCalledTimes(1);
	});

	it('should throw when subject does not exist', async () => {
		subjectRepository.findById.mockResolvedValue(null);

		await expectRejection(
			handler.execute(
				new SetScheduleCommand('sub-1', [
					{ dayOfWeek: DAYOFWEEK.MONDAY, startTime: '08:00', endTime: '09:00' },
				]),
			),
			NotFoundError,
			'Materia no encontrada',
		);

		expect(scheduleRepository.deleteBySubject).not.toHaveBeenCalled();
		expect(scheduleRepository.saveMany).not.toHaveBeenCalled();
	});

	it('should throw when new slots overlap with existing slots of other subjects', async () => {
		subjectRepository.findById.mockResolvedValue(mockSubject);
		scheduleRepository.findByCourse.mockResolvedValue(existingSlots);

		await expect(
			handler.execute(
				new SetScheduleCommand('sub-1', [
					{ dayOfWeek: DAYOFWEEK.MONDAY, startTime: '08:00', endTime: '09:00' }, // solapa con slot existente
				]),
			),
		).rejects.toThrow();

		expect(scheduleRepository.deleteBySubject).not.toHaveBeenCalled();
		expect(scheduleRepository.saveMany).not.toHaveBeenCalled();
	});

	it('should replace existing slots of same subject without overlap error', async () => {
		const slotsWithSameSubject = [
			ScheduleSlot.reconstitute({
				id: 'slot-old',
				subjectId: 'sub-1', // misma materia — debe excluirse de la validación
				dayOfWeek: DAYOFWEEK.MONDAY,
				startTime: '08:00',
				endTime: '09:00',
				createdAt: new Date(),
			}),
		];

		subjectRepository.findById.mockResolvedValue(mockSubject);
		scheduleRepository.findByCourse.mockResolvedValue(slotsWithSameSubject);

		await handler.execute(
			new SetScheduleCommand('sub-1', [
				{ dayOfWeek: DAYOFWEEK.MONDAY, startTime: '08:00', endTime: '09:00' }, // mismo horario — no debe fallar
			]),
		);

		expect(scheduleRepository.deleteBySubject).toHaveBeenCalledWith('sub-1');
		expect(scheduleRepository.saveMany).toHaveBeenCalledTimes(1);
	});

	it('should set full course schedule when courseId is provided', async () => {
		courseRepository.findById.mockResolvedValue(mockCourse);
		subjectRepository.findByCourse.mockResolvedValue([mockSubject]);

		await handler.execute(
			new SetScheduleCommand(
				undefined,
				[
					{
						subjectId: 'sub-1',
						dayOfWeek: DAYOFWEEK.MONDAY,
						startTime: '08:00',
						endTime: '09:00',
					},
					{
						subjectId: 'sub-2',
						dayOfWeek: DAYOFWEEK.MONDAY,
						startTime: '09:00',
						endTime: '10:00',
					},
				],
				'course-1',
			),
		);

		expect(courseRepository.findById).toHaveBeenCalledWith('course-1');
		expect(scheduleRepository.deleteByCourse).toHaveBeenCalledWith('course-1');
		expect(scheduleRepository.saveMany).toHaveBeenCalledTimes(1);
	});

	it('should throw when subject schedule exceeds its weeklyHours', async () => {
		subjectRepository.findById.mockResolvedValue(mockSubject); // weeklyHours: 4
		scheduleRepository.findByCourse.mockResolvedValue([]);

		await expect(
			handler.execute(
				new SetScheduleCommand('sub-1', [
					{ dayOfWeek: DAYOFWEEK.TUESDAY, startTime: '08:00', endTime: '10:00' }, // 2h
					{ dayOfWeek: DAYOFWEEK.WEDNESDAY, startTime: '08:00', endTime: '10:00' }, // 2h
					{ dayOfWeek: DAYOFWEEK.THURSDAY, startTime: '08:00', endTime: '09:00' }, // 1h -> 5h
				]),
			),
		).rejects.toThrow(DomainError);

		expect(scheduleRepository.deleteBySubject).not.toHaveBeenCalled();
		expect(scheduleRepository.saveMany).not.toHaveBeenCalled();
	});

	it('should throw when courseId schedule exceeds a subject weeklyHours', async () => {
		courseRepository.findById.mockResolvedValue(mockCourse);
		subjectRepository.findByCourse.mockResolvedValue([mockSubject]); // weeklyHours: 4

		await expect(
			handler.execute(
				new SetScheduleCommand(
					undefined,
					[
						{
							subjectId: 'sub-1',
							dayOfWeek: DAYOFWEEK.MONDAY,
							startTime: '08:00',
							endTime: '10:00',
						}, // 2h
						{
							subjectId: 'sub-1',
							dayOfWeek: DAYOFWEEK.TUESDAY,
							startTime: '08:00',
							endTime: '10:00',
						}, // 2h
						{
							subjectId: 'sub-1',
							dayOfWeek: DAYOFWEEK.WEDNESDAY,
							startTime: '08:00',
							endTime: '09:00',
						}, // 1h -> 5h
					],
					'course-1',
				),
			),
		).rejects.toThrow(DomainError);

		expect(scheduleRepository.deleteByCourse).not.toHaveBeenCalled();
		expect(scheduleRepository.saveMany).not.toHaveBeenCalled();
	});
});
