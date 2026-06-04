import { STUDENTSTATUS } from '@repo/common';
// delete-student.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { DeleteStudentCommand } from '../../../../src/modules/academic/application/commands/delete-student/delete-student.command';
import { DeleteStudentHandler } from '../../../../src/modules/academic/application/commands/delete-student/delete-student.handler';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';

describe('DeleteStudentHandler', () => {
	let handler: DeleteStudentHandler;
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
		handler = new DeleteStudentHandler(studentRepository);
	});

	it('should deactivate student', async () => {
		studentRepository.findById.mockResolvedValue(mockStudent);

		await handler.execute(new DeleteStudentCommand('student-id'));

		expect(studentRepository.save).toHaveBeenCalledTimes(1);
		const saved = studentRepository.save.mock.calls[0][0];
		expect(saved.status).toBe(STUDENTSTATUS.INACTIVE);
	});

	it('should throw when student does not exist', async () => {
		studentRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new DeleteStudentCommand('student-id')),
		).rejects.toThrow();

		expect(studentRepository.save).not.toHaveBeenCalled();
	});

	it('should throw when student is already inactive', async () => {
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
			handler.execute(new DeleteStudentCommand('student-id')),
		).rejects.toThrow();

		expect(studentRepository.save).not.toHaveBeenCalled();
	});
});
