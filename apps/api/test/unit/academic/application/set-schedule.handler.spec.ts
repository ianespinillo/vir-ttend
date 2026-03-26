import { DAYOFWEEK } from '@repo/common';
// set-schedule.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { SetScheduleCommand } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.command';
import { SetScheduleHandler } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.handler';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';

describe('SetScheduleHandler', () => {
	let handler: SetScheduleHandler;
	let scheduleRepository: MockProxy<IScheduleRepository>;
	let subjectRepository: MockProxy<ISubjectRepository>;

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

		handler = new SetScheduleHandler(scheduleRepository, subjectRepository);
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

		await expect(
			handler.execute(
				new SetScheduleCommand('sub-1', [
					{ dayOfWeek: DAYOFWEEK.MONDAY, startTime: '08:00', endTime: '09:00' },
				]),
			),
		).rejects.toThrow('Subject not found');

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
});
