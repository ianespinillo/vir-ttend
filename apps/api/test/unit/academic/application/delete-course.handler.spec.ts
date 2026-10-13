import { LEVEL, SHIFT } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { DeleteCourseCommand } from '../../../../src/modules/academic/application/commands/delete-course/delete-course.command';
import { DeleteCourseHandler } from '../../../../src/modules/academic/application/commands/delete-course/delete-course.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';

// delete-course.handler.spec.ts
describe('DeleteCourseHandler', () => {
	let handler: DeleteCourseHandler;
	let courseRepository: MockProxy<ICourseRepository>;
	let subjectRepository: MockProxy<ISubjectRepository>;
	let scheduleRepository: MockProxy<IScheduleRepository>;

	const course = Course.reconstitute({
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
	});

	const subjects = [
		Subject.reconstitute({
			id: 'sub-1',
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: 'Matemática',
			area: 'Exactas',
			weeklyHours: 5,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
		Subject.reconstitute({
			id: 'sub-2',
			courseId: 'course-1',
			teacherId: 'teacher-2',
			name: 'Lengua',
			area: 'Sociales',
			weeklyHours: 4,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
	];

	beforeEach(() => {
		courseRepository = mock<ICourseRepository>();
		subjectRepository = mock<ISubjectRepository>();
		scheduleRepository = mock<IScheduleRepository>();
		handler = new DeleteCourseHandler(
			courseRepository,
			subjectRepository,
			scheduleRepository,
		);
	});

	it('desactiva el curso y borra en cascada sus materias y slots', async () => {
		courseRepository.findById.mockResolvedValue(course);
		subjectRepository.findByCourse.mockResolvedValue(subjects);

		await handler.execute(new DeleteCourseCommand('course-1'));

		expect(course.isActive).toBe(false);
		expect(courseRepository.save).toHaveBeenCalledTimes(1);
		expect(courseRepository.save).toHaveBeenCalledWith(course);
		expect(subjectRepository.findByCourse).toHaveBeenCalledWith('course-1');
		expect(subjectRepository.save).toHaveBeenCalledTimes(2);
		expect(subjects[0].deletedAt).toBeDefined();
		expect(subjects[1].deletedAt).toBeDefined();
		expect(scheduleRepository.deleteByCourse).toHaveBeenCalledTimes(1);
		expect(scheduleRepository.deleteByCourse).toHaveBeenCalledWith('course-1');
	});

	it('no cascadea nada cuando el curso no existe', async () => {
		courseRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new DeleteCourseCommand('course-1')),
		).rejects.toThrow('Course not found');

		expect(courseRepository.save).not.toHaveBeenCalled();
		expect(subjectRepository.findByCourse).not.toHaveBeenCalled();
		expect(scheduleRepository.deleteByCourse).not.toHaveBeenCalled();
	});
});
