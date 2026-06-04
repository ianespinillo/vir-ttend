import { EventEmitter2 } from '@nestjs/event-emitter';
import { STUDENTSTATUS } from '@repo/common';
// create-student.handler.spec.ts
import { MockProxy, mock } from 'jest-mock-extended';
import { CreateStudentCommand } from '../../../../src/modules/academic/application/commands/create-student/create-student.command';
import { CreateStudentHandler } from '../../../../src/modules/academic/application/commands/create-student/create-student.handler';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';

describe('CreateStudentHandler', () => {
	let handler: CreateStudentHandler;
	let studentRepository: MockProxy<IStudentRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;

	beforeEach(() => {
		studentRepository = mock<IStudentRepository>();
		eventEmitter = mock<EventEmitter2>();
		handler = new CreateStudentHandler(studentRepository, eventEmitter);
	});

	it('should create student when document is unique in tenant', async () => {
		studentRepository.findByDocument.mockResolvedValue(null);

		const result = await handler.execute(
			new CreateStudentCommand(
				'tenant-id',
				'Juan',
				'Garcia',
				'course-id',
				'12345678',
				new Date('2010-05-15'),
				'Maria Garcia',
				'1123456789',
			),
		);

		expect(studentRepository.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'student.created',
			expect.any(Object),
		);
		expect(result.firstName).toBe('Juan');
		expect(result.documentNumber.getValue()).toBe('12345678');
	});

	it('should throw when document already exists in tenant', async () => {
		studentRepository.findByDocument.mockResolvedValue(
			Student.reconstitute({
				id: 'existing-id',
				tenantId: 'tenant-id',
				courseId: 'course-id',
				firstName: 'Pedro',
				lastName: 'Lopez',
				documentNumber: '12345678',
				birthDate: new Date('2009-01-01'),
				tutorName: 'Ana Lopez',
				tutorPhone: '123-45678',
				status: STUDENTSTATUS.ACTIVE,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		await expect(
			handler.execute(
				new CreateStudentCommand(
					'tenant-id',
					'Juan',
					'Garcia',
					'course-id',
					'12345678',
					new Date('2010-05-15'),
					'Maria Garcia',
					'1123456789',
				),
			),
		).rejects.toThrow();

		expect(studentRepository.save).not.toHaveBeenCalled();
	});
});
