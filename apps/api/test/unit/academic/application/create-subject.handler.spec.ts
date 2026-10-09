import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LEVEL, SHIFT } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { CreateSubjectCommand } from '../../../../src/modules/academic/application/commands/create-subject/create-subject.command';
import { CreateSubjectHandler } from '../../../../src/modules/academic/application/commands/create-subject/create-subject.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { IMembershipPort } from '../../../../src/modules/academic/domain/ports/membership.port.interface';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';

describe('CreateSubjectHandler', () => {
	let handler: CreateSubjectHandler;
	let subjectRepository: MockProxy<ISubjectRepository>;
	let courseRepository: MockProxy<ICourseRepository>;
	let membershipPort: MockProxy<IMembershipPort>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const mockCourse = Course.reconstitute({
		id: 'course-1',
		tenantId: 'tenant-1',
		academicYearId: 'ay-1',
		preceptorId: 'preceptor-1',
		level: LEVEL.PRIMARY,
		yearNumber: 3,
		division: 'A',
		shift: SHIFT.MORNING,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const command = new CreateSubjectCommand(
		'course-1',
		'teacher-1',
		'Matemática',
		'Exactas',
		5,
	);

	beforeEach(() => {
		subjectRepository = mock<ISubjectRepository>();
		courseRepository = mock<ICourseRepository>();
		membershipPort = mock<IMembershipPort>();
		eventEmitter = mock<EventEmitter2>();

		handler = new CreateSubjectHandler(
			subjectRepository,
			courseRepository,
			membershipPort,
			eventEmitter,
		);
	});

	it('crea la materia cuando no existe', async () => {
		courseRepository.findById.mockResolvedValue(mockCourse);
		membershipPort.belongsToTenant.mockResolvedValue(true);
		subjectRepository.findByCourse.mockResolvedValue([]);

		await handler.execute(command);

		expect(subjectRepository.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'subject.created',
			expect.anything(),
		);
	});

	it('debe lanzar BadRequestException cuando la materia ya existe', async () => {
		courseRepository.findById.mockResolvedValue(mockCourse);
		membershipPort.belongsToTenant.mockResolvedValue(true);
		subjectRepository.findByCourse.mockResolvedValue([
			Subject.reconstitute({
				id: 'subject-1',
				courseId: 'course-1',
				teacherId: 'teacher-1',
				name: 'Matemática',
				area: 'Exactas',
				weeklyHours: 5,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		]);

		await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
		await expect(handler.execute(command)).rejects.toThrow(
			'Subject already exists',
		);
		expect(subjectRepository.save).not.toHaveBeenCalled();
	});
});
