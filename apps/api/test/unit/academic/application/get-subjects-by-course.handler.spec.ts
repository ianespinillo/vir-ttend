import { MockProxy, mock } from 'jest-mock-extended';
import { GetSubjectsByCourseHandler } from '../../../../src/modules/academic/application/queries/get-subjects-by-course/get-subjects-by-course.handler';
import { GetSubjectsByCourseQuery } from '../../../../src/modules/academic/application/queries/get-subjects-by-course/get-subjects-by-course.query';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { User } from '../../../../src/modules/identity/domain/entities/user.entity';
import { IUserRepository } from '../../../../src/modules/identity/domain/repositories/user.repository.interface';

describe('GetSubjectsByCourseHandler', () => {
	let handler: GetSubjectsByCourseHandler;
	let subjectRepo: MockProxy<ISubjectRepository>;
	let userRepo: MockProxy<IUserRepository>;

	const teacherUser = User.reconstitute({
		id: 'teacher-1',
		email: 'teacher@school.edu',
		passwordHash: 'hash',
		firstName: 'Ada',
		lastName: 'Lovelace',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		mustChangePassword: false,
	});

	const subjectWithTeacher = Subject.reconstitute({
		id: 'sub-1',
		courseId: 'course-1',
		teacherId: 'teacher-1',
		name: 'Matemática',
		area: 'Ciencias Exactas',
		weeklyHours: 4,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const subjectWithoutTeacher = Subject.reconstitute({
		id: 'sub-2',
		courseId: 'course-1',
		teacherId: undefined,
		name: 'Historia',
		area: 'Ciencias Sociales',
		weeklyHours: 3,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		subjectRepo = mock<ISubjectRepository>();
		userRepo = mock<IUserRepository>();
		handler = new GetSubjectsByCourseHandler(subjectRepo, userRepo);
	});

	it('resolves teacherName for subjects with an assigned teacher', async () => {
		subjectRepo.findByCourse.mockResolvedValue([
			subjectWithTeacher,
			subjectWithoutTeacher,
		]);
		userRepo.findByIds.mockResolvedValue([teacherUser]);

		const result = await handler.execute(
			new GetSubjectsByCourseQuery('course-1'),
		);

		expect(subjectRepo.findByCourse).toHaveBeenCalledWith('course-1');
		expect(userRepo.findByIds).toHaveBeenCalledWith(['teacher-1']);
		expect(result).toHaveLength(2);

		expect(result[0].id).toBe('sub-1');
		expect(result[0].teacherId).toBe('teacher-1');
		expect(result[0].teacherName).toBe('Ada Lovelace');

		expect(result[1].id).toBe('sub-2');
		expect(result[1].teacherId).toBeUndefined();
		expect(result[1].teacherName).toBeUndefined();
	});

	it('returns subjects without teacherName when no teacher is assigned or found', async () => {
		subjectRepo.findByCourse.mockResolvedValue([subjectWithoutTeacher]);
		userRepo.findByIds.mockResolvedValue([]);

		const result = await handler.execute(
			new GetSubjectsByCourseQuery('course-1'),
		);

		expect(userRepo.findByIds).not.toHaveBeenCalled();
		expect(result).toHaveLength(1);
		expect(result[0].teacherName).toBeUndefined();
	});
});
