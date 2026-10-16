import { LEVEL, SHIFT, STUDENTSTATUS } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetStudentsByCourseHandler } from '../../../../src/modules/academic/application/queries/get-students-by-course/get-students-by-course.handler';
import { GetStudentsByCourseQuery } from '../../../../src/modules/academic/application/queries/get-students-by-course/get-students-by-course.query';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';

describe('GetStudentsByCourseHandler (preceptor scoping)', () => {
	let handler: GetStudentsByCourseHandler;
	let studentRepo: MockProxy<IStudentRepository>;
	let courseRepo: MockProxy<ICourseRepository>;

	const course1 = Course.reconstitute({
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

	const course2 = Course.reconstitute({
		id: 'course-2',
		tenantId: 'tenant-1',
		academicYearId: 'ay-1',
		preceptorId: 'preceptor-1',
		level: LEVEL.SECONDARY,
		yearNumber: 2,
		division: 'B',
		shift: SHIFT.AFTERNOON,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const student1 = Student.reconstitute({
		id: 'student-1',
		tenantId: 'tenant-1',
		courseId: 'course-1',
		firstName: 'Ana',
		lastName: 'Pérez',
		documentNumber: '40111222',
		birthDate: new Date('2008-01-01'),
		tutorName: 'Tutor Pérez',
		tutorPhone: '1122334455',
		status: STUDENTSTATUS.ACTIVE,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		studentRepo = mock<IStudentRepository>();
		courseRepo = mock<ICourseRepository>();
		handler = new GetStudentsByCourseHandler(studentRepo, courseRepo);
	});

	it('allows ADMIN (no preceptorId) to query any course or all courses', async () => {
		studentRepo.search.mockResolvedValue({
			items: [student1],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		courseRepo.findById.mockResolvedValue(course1);

		const result = await handler.execute(
			new GetStudentsByCourseQuery(
				'tenant-1',
				'course-any',
				1,
				10,
				undefined,
				undefined,
				undefined,
			),
		);

		expect(studentRepo.search).toHaveBeenCalledWith(
			expect.objectContaining({
				tenantId: 'tenant-1',
				courseId: 'course-any',
				courseIds: undefined,
			}),
		);
		expect(result.items).toHaveLength(1);
	});

	it('scopes search to all preceptor courses when preceptorId is given and courseId is not specified', async () => {
		courseRepo.findByPreceptor.mockResolvedValue([course1, course2]);
		studentRepo.search.mockResolvedValue({
			items: [student1],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		courseRepo.findById.mockResolvedValue(course1);

		const result = await handler.execute(
			new GetStudentsByCourseQuery(
				'tenant-1',
				undefined,
				1,
				10,
				undefined,
				undefined,
				'preceptor-1',
			),
		);

		expect(courseRepo.findByPreceptor).toHaveBeenCalledWith('preceptor-1');
		expect(studentRepo.search).toHaveBeenCalledWith(
			expect.objectContaining({
				tenantId: 'tenant-1',
				courseId: undefined,
				courseIds: ['course-1', 'course-2'],
			}),
		);
		expect(result.items).toHaveLength(1);
	});

	it('scopes search to the requested course if it belongs to the preceptor', async () => {
		courseRepo.findByPreceptor.mockResolvedValue([course1, course2]);
		studentRepo.search.mockResolvedValue({
			items: [student1],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		courseRepo.findById.mockResolvedValue(course1);

		const result = await handler.execute(
			new GetStudentsByCourseQuery(
				'tenant-1',
				'course-1',
				1,
				10,
				undefined,
				undefined,
				'preceptor-1',
			),
		);

		expect(studentRepo.search).toHaveBeenCalledWith(
			expect.objectContaining({
				tenantId: 'tenant-1',
				courseId: undefined,
				courseIds: ['course-1'],
			}),
		);
		expect(result.items).toHaveLength(1);
	});

	it('returns empty results without querying students if courseId does not belong to preceptor', async () => {
		courseRepo.findByPreceptor.mockResolvedValue([course1]);

		const result = await handler.execute(
			new GetStudentsByCourseQuery(
				'tenant-1',
				'course-other',
				1,
				10,
				undefined,
				undefined,
				'preceptor-1',
			),
		);

		expect(studentRepo.search).not.toHaveBeenCalled();
		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(0);
	});

	it('returns empty results immediately if preceptor has no assigned courses', async () => {
		courseRepo.findByPreceptor.mockResolvedValue([]);

		const result = await handler.execute(
			new GetStudentsByCourseQuery(
				'tenant-1',
				undefined,
				1,
				10,
				undefined,
				undefined,
				'preceptor-without-courses',
			),
		);

		expect(studentRepo.search).not.toHaveBeenCalled();
		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(0);
	});
});
