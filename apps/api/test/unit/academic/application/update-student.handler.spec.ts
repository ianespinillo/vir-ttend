import { STUDENTSTATUS } from '@repo/common';
// update-student.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { UpdateStudentCommand } from '../../../../src/modules/academic/application/commands/update-student/update-student.command';
import { UpdateStudentHandler } from '../../../../src/modules/academic/application/commands/update-student/update-student.handler';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';
import { DocumentNumber } from '../../../../src/modules/academic/domain/value-objects/document-number.vo';
import { Tutor } from '../../../../src/modules/academic/domain/value-objects/tutor.vo';
import { Email } from '../../../../src/modules/identity/domain/value-objects/email.vo';

describe('UpdateStudentHandler', () => {
	let handler: UpdateStudentHandler;
	let studentRepository: MockProxy<IStudentRepository>;

	const mockStudent = Student.reconstitute({
		id: 'student-id',
		tenantId: 'tenant-id',
		courseId: 'course-id',
		firstName: 'Juan',
		lastName: 'Garcia',
		documentNumber: '12345678',
		birthDate: new Date('2010-05-15'),
		tutorName: 'Maria Lopez',
		tutorPhone: '1234567890',
		status: STUDENTSTATUS.ACTIVE,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		studentRepository = mock<IStudentRepository>();
		handler = new UpdateStudentHandler(studentRepository);
	});

	it('should update student personal info', async () => {
		studentRepository.findById.mockResolvedValue(mockStudent);

		await handler.execute(
			new UpdateStudentCommand(
				'student-id',
				'Pedro',
				'Lopez',
				new Date('2010-06-20'),
				undefined,
			),
		);

		expect(studentRepository.save).toHaveBeenCalledTimes(1);
		const saved = studentRepository.save.mock.calls[0][0];
		expect(saved.firstName).toBe('Pedro');
		expect(saved.lastName).toBe('Lopez');
	});

	it('should update tutor info', async () => {
		studentRepository.findById.mockResolvedValue(mockStudent);

		await handler.execute(
			new UpdateStudentCommand(
				'student-id',
				undefined,
				undefined,
				undefined,
				'Ana Lopez',
				'1187654321',
				'ana@email.com',
			),
		);

		expect(studentRepository.save).toHaveBeenCalledTimes(1);
		const saved = studentRepository.save.mock.calls[0][0];
		expect(saved.tutorName).toBe('Ana Lopez');
		expect(saved.tutorEmail).toBe('ana@email.com');
	});

	it('should throw when student does not exist', async () => {
		studentRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(
				new UpdateStudentCommand(
					'student-id',
					'Pedro',
					undefined,
					undefined,
					undefined,
				),
			),
		).rejects.toThrow();

		expect(studentRepository.save).not.toHaveBeenCalled();
	});
});
