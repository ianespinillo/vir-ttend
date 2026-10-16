import { LEVEL, SHIFT, STUDENTSTATUS } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { SearchStudentsHandler } from '../../../../src/modules/academic/application/queries/search-students/search-students.handler';
import { SearchStudentsQuery } from '../../../../src/modules/academic/application/queries/search-students/search-students.query';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';

describe('SearchStudentsHandler (preceptor scoping)', () => {
	let handler: SearchStudentsHandler;
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
		handler = new SearchStudentsHandler(studentRepo, courseRepo);
	});

	it('allows ADMIN to search across all tenant courses', async () => {
		studentRepo.search.mockResolvedValue({
			items: [student1],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		courseRepo.findById.mockResolvedValue(course1);

		const result = await handler.execute(
			new SearchStudentsQuery('Pérez', 'tenant-1', 1, 10, undefined),
		);

		expect(studentRepo.search).toHaveBeenCalledWith(
			expect.objectContaining({
				query: 'Pérez',
				tenantId: 'tenant-1',
				courseIds: undefined,
			}),
		);
		expect(result.items).toHaveLength(1);
	});

	it('scopes search to preceptor courses when preceptorId is provided', async () => {
		courseRepo.findByPreceptor.mockResolvedValue([course1]);
		studentRepo.search.mockResolvedValue({
			items: [student1],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		courseRepo.findById.mockResolvedValue(course1);

		const result = await handler.execute(
			new SearchStudentsQuery('Pérez', 'tenant-1', 1, 10, 'preceptor-1'),
		);

		expect(courseRepo.findByPreceptor).toHaveBeenCalledWith('preceptor-1');
		expect(studentRepo.search).toHaveBeenCalledWith(
			expect.objectContaining({
				query: 'Pérez',
				tenantId: 'tenant-1',
				courseIds: ['course-1'],
			}),
		);
		expect(result.items).toHaveLength(1);
	});

	it('returns empty results without querying students if preceptor has no courses', async () => {
		courseRepo.findByPreceptor.mockResolvedValue([]);

		const result = await handler.execute(
			new SearchStudentsQuery(
				'Pérez',
				'tenant-1',
				1,
				10,
				'preceptor-without-courses',
			),
		);

		expect(studentRepo.search).not.toHaveBeenCalled();
		expect(result.items).toHaveLength(0);
	});
});
