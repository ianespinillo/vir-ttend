import { MockProxy, mock } from 'jest-mock-extended';
import { DeleteSubjectCommand } from '../../../../src/modules/academic/application/commands/delete-subject/delete-subject.command';
import { DeleteSubjectHandler } from '../../../../src/modules/academic/application/commands/delete-subject/delete-subject.handler';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';

// delete-subject.handler.spec.ts
describe('DeleteSubjectHandler', () => {
	let handler: DeleteSubjectHandler;
	let subjectRepository: MockProxy<ISubjectRepository>;
	let scheduleRepository: MockProxy<IScheduleRepository>;

	const subject = Subject.reconstitute({
		id: 'sub-1',
		courseId: 'course-1',
		teacherId: 'teacher-1',
		name: 'Matemática',
		area: 'Exactas',
		weeklyHours: 5,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		subjectRepository = mock<ISubjectRepository>();
		scheduleRepository = mock<IScheduleRepository>();
		handler = new DeleteSubjectHandler(subjectRepository, scheduleRepository);
	});

	it('hace baja lógica de la materia y borra sus slots en cascada', async () => {
		subjectRepository.findById.mockResolvedValue(subject);

		await handler.execute(new DeleteSubjectCommand('sub-1'));

		expect(subjectRepository.save).toHaveBeenCalledTimes(1);
		expect(subjectRepository.save).toHaveBeenCalledWith(subject);
		expect(subject.deletedAt).toBeDefined();
		expect(scheduleRepository.deleteBySubject).toHaveBeenCalledTimes(1);
		expect(scheduleRepository.deleteBySubject).toHaveBeenCalledWith('sub-1');
	});

	it('no borra slots cuando la materia no existe', async () => {
		subjectRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new DeleteSubjectCommand('sub-1')),
		).rejects.toThrow('Subject not found');

		expect(subjectRepository.save).not.toHaveBeenCalled();
		expect(scheduleRepository.deleteBySubject).not.toHaveBeenCalled();
	});
});
