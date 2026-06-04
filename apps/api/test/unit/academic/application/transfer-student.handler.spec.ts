import { LEVEL, SHIFT, STUDENTSTATUS } from '@repo/common';
// transfer-student.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { TransferStudentCommand } from '../../../../src/modules/academic/application/commands/transer-student/transer-student.command';
import { TransferStudentHandler } from '../../../../src/modules/academic/application/commands/transer-student/transer-student.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';

describe('TransferStudentHandler', () => {
	let handler: TransferStudentHandler;
	let studentRepository: MockProxy<IStudentRepository>;
	let courseRepository: MockProxy<ICourseRepository>;

	const mockStudent = Student.reconstitute({
		id: 'student-id',
		tenantId: 'tenant-id',
		courseId: 'course-id',
		firstName: 'Juan',
		lastName: 'Garcia',
		documentNumber: '12345678',
		birthDate: new Date('2010-05-15'),
		tutorName: 'Maria Garcia',
		tutorPhone: '1123456789',
		status: STUDENTSTATUS.ACTIVE,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const mockCourse = Course.reconstitute({
		id: 'new-course-id',
		tenantId: 'tenant-id',
		academicYearId: 'ay-1',
		preceptorId: 'preceptor-id',
		level: LEVEL.PRIMARY,
		yearNumber: 4,
		division: 'B',
		shift: SHIFT.MORNING,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		studentRepository = mock<IStudentRepository>();
		courseRepository = mock<ICourseRepository>();
		handler = new TransferStudentHandler(studentRepository, courseRepository);
	});

	it('should transfer student to new course', async () => {
		studentRepository.findById.mockResolvedValue(mockStudent);
		courseRepository.findById.mockResolvedValue(mockCourse);

		await handler.execute(
			new TransferStudentCommand('student-id', 'new-course-id'),
		);

		expect(studentRepository.save).toHaveBeenCalledTimes(1);
		const saved = studentRepository.save.mock.calls[0][0];
		expect(saved.courseId).toBe('new-course-id');
		expect(saved.status).toBe(STUDENTSTATUS.TRANSFERRED);
	});

	it('should throw when student does not exist', async () => {
		studentRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new TransferStudentCommand('student-id', 'new-course-id')),
		).rejects.toThrow();

		expect(studentRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when target course does not exist', async () => {
		studentRepository.findById.mockResolvedValue(mockStudent);
		courseRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new TransferStudentCommand('student-id', 'new-course-id')),
		).rejects.toThrow();

		expect(studentRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when student is already in target course', async () => {
		const studentInSameCourse = Student.reconstitute({
			id: 'student-id',
			tenantId: 'tenant-id',
			courseId: 'new-course-id',
			firstName: 'Juan',
			lastName: 'Garcia',
			documentNumber: '12345678',
			birthDate: new Date('2010-05-15'),
			tutorName: 'Maria Garcia',
			tutorPhone: '1123456789',
			status: STUDENTSTATUS.ACTIVE,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		studentRepository.findById.mockResolvedValue(studentInSameCourse);
		courseRepository.findById.mockResolvedValue(mockCourse);

		await expect(
			handler.execute(new TransferStudentCommand('student-id', 'new-course-id')),
		).rejects.toThrow();

		expect(studentRepository.save).not.toHaveBeenCalled();
	});
});
