import { LEVEL, SHIFT } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { NotFoundError } from '../../../../src/common/errors';
import { GetCourseHandler } from '../../../../src/modules/academic/application/queries/get-course/get-course.handler';
import { GetCourseQuery } from '../../../../src/modules/academic/application/queries/get-course/get-course.query';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { User } from '../../../../src/modules/identity/domain/entities/user.entity';
import { IUserRepository } from '../../../../src/modules/identity/domain/repositories/user.repository.interface';
import { expectRejection } from '../expect-rejection';

describe('GetCourseHandler', () => {
	let handler: GetCourseHandler;
	let courseRepo: MockProxy<ICourseRepository>;
	let subjectRepo: MockProxy<ISubjectRepository>;
	let slotRepo: MockProxy<IScheduleRepository>;
	let userRepo: MockProxy<IUserRepository>;

	const mockCourse = Course.reconstitute({
		id: 'course-1',
		tenantId: 'tenant-1',
		academicYearId: 'ay-1',
		preceptorId: 'preceptor-1',
		level: LEVEL.SECONDARY,
		yearNumber: 2,
		division: 'B',
		shift: SHIFT.MORNING,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const preceptorUser = User.reconstitute({
		id: 'preceptor-1',
		email: 'preceptor@school.edu',
		passwordHash: 'hash',
		firstName: 'Carlos',
		lastName: 'Gómez',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		mustChangePassword: false,
	});

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
		name: 'Física',
		area: 'Ciencias Exactas',
		weeklyHours: 3,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		courseRepo = mock<ICourseRepository>();
		subjectRepo = mock<ISubjectRepository>();
		slotRepo = mock<IScheduleRepository>();
		userRepo = mock<IUserRepository>();

		handler = new GetCourseHandler(courseRepo, subjectRepo, slotRepo, userRepo);
	});

	it('throws NotFoundError when course does not exist', async () => {
		courseRepo.findById.mockResolvedValue(null);

		await expectRejection(
			handler.execute(new GetCourseQuery('non-existent')),
			NotFoundError,
			'Curso no encontrado',
		);
	});

	it('returns course details with preceptorName and subjects enriched with teacherName', async () => {
		courseRepo.findById.mockResolvedValue(mockCourse);
		userRepo.findById.mockResolvedValue(preceptorUser);
		slotRepo.findByCourse.mockResolvedValue([]);
		subjectRepo.findByCourse.mockResolvedValue([subjectWithTeacher]);
		userRepo.findByIds.mockResolvedValue([teacherUser]);

		const result = await handler.execute(new GetCourseQuery('course-1'));

		expect(result.id).toBe('course-1');
		expect(result.preceptorName).toBe('Carlos Gómez');
		expect(result.subjects).toHaveLength(1);
		expect(result.subjects[0].teacherId).toBe('teacher-1');
		expect(result.subjects[0].teacherName).toBe('Ada Lovelace');
	});
});
