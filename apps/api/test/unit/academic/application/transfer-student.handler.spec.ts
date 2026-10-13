import { STUDENTSTATUS } from '@repo/common';
// transfer-student.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { TransferStudentCommand } from '../../../../src/modules/academic/application/commands/transer-student/transer-student.command';
import { TransferStudentHandler } from '../../../../src/modules/academic/application/commands/transer-student/transer-student.handler';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';

describe('TransferStudentHandler', () => {
	let handler: TransferStudentHandler;
	let studentRepository: MockProxy<IStudentRepository>;

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

	beforeEach(() => {
		studentRepository = mock<IStudentRepository>();
		handler = new TransferStudentHandler(studentRepository);
	});

	it('should mark student as transferred keeping the current course', async () => {
		studentRepository.findById.mockResolvedValue(mockStudent);

		await handler.execute(new TransferStudentCommand('student-id'));

		expect(studentRepository.save).toHaveBeenCalledTimes(1);
		const saved = studentRepository.save.mock.calls[0][0];
		expect(saved.status).toBe(STUDENTSTATUS.TRANSFERRED);
		expect(saved.courseId).toBe('course-id');
	});

	it('should throw when student does not exist', async () => {
		studentRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new TransferStudentCommand('student-id')),
		).rejects.toThrow();

		expect(studentRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when student is inactive', async () => {
		const inactiveStudent = Student.reconstitute({
			id: 'student-id',
			tenantId: 'tenant-id',
			courseId: 'course-id',
			firstName: 'Juan',
			lastName: 'Garcia',
			documentNumber: '12345678',
			birthDate: new Date('2010-05-15'),
			tutorName: 'Maria Garcia',
			tutorPhone: '1123456789',
			status: STUDENTSTATUS.INACTIVE,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		studentRepository.findById.mockResolvedValue(inactiveStudent);

		await expect(
			handler.execute(new TransferStudentCommand('student-id')),
		).rejects.toThrow('Student is already inactive');

		expect(studentRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when student is already transferred', async () => {
		const transferredStudent = Student.reconstitute({
			id: 'student-id',
			tenantId: 'tenant-id',
			courseId: 'course-id',
			firstName: 'Juan',
			lastName: 'Garcia',
			documentNumber: '12345678',
			birthDate: new Date('2010-05-15'),
			tutorName: 'Maria Garcia',
			tutorPhone: '1123456789',
			status: STUDENTSTATUS.TRANSFERRED,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		studentRepository.findById.mockResolvedValue(transferredStudent);

		await expect(
			handler.execute(new TransferStudentCommand('student-id')),
		).rejects.toThrow('Student is already transferred');

		expect(studentRepository.save).not.toHaveBeenCalled();
	});
});
