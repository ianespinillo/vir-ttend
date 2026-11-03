import { EventEmitter2 } from '@nestjs/event-emitter';
import { LEVEL, SHIFT, SUBJECT_KIND } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import {
	BusinessRuleError,
	ConflictError,
	DomainError,
} from '../../../../src/common/errors';
import { CreateSubjectCommand } from '../../../../src/modules/academic/application/commands/create-subject/create-subject.command';
import { CreateSubjectHandler } from '../../../../src/modules/academic/application/commands/create-subject/create-subject.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { WorkshopCommission } from '../../../../src/modules/academic/domain/entities/workshop-commission.entity';
import { IMembershipPort } from '../../../../src/modules/academic/domain/ports/membership.port.interface';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { IWorkshopCommissionRepository } from '../../../../src/modules/academic/domain/repositories/workshop-commission.repository.interface';
import { expectRejection } from '../expect-rejection';

describe('CreateSubjectHandler', () => {
	let handler: CreateSubjectHandler;
	let subjectRepository: MockProxy<ISubjectRepository>;
	let courseRepository: MockProxy<ICourseRepository>;
	let membershipPort: MockProxy<IMembershipPort>;
	let eventEmitter: MockProxy<EventEmitter2>;
	let commissionRepository: MockProxy<IWorkshopCommissionRepository>;

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
		commissionRepository = mock<IWorkshopCommissionRepository>();

		handler = new CreateSubjectHandler(
			subjectRepository,
			courseRepository,
			membershipPort,
			eventEmitter,
			commissionRepository,
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

	it('debe lanzar ConflictError cuando la materia ya existe', async () => {
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

		await expectRejection(
			handler.execute(command),
			ConflictError,
			'Ya existe esa materia en el curso.',
		);
		expect(subjectRepository.save).not.toHaveBeenCalled();
	});

	it('stores a manual teacher name when no teacher account is given', async () => {
		courseRepository.findById.mockResolvedValue(mockCourse);
		subjectRepository.findByCourse.mockResolvedValue([]);

		await handler.execute(
			new CreateSubjectCommand(
				'course-1',
				'NONE',
				'Historia',
				'Sociales',
				3,
				undefined,
				'  Laura Gómez  ',
			),
		);

		const saved = subjectRepository.save.mock.calls[0][0];
		expect(saved.teacherId).toBeUndefined();
		expect(saved.teacherName).toBe('Laura Gómez');
		expect(membershipPort.belongsToTenant).not.toHaveBeenCalled();
	});

	it('ignores the manual teacher name when a teacher account is given', async () => {
		courseRepository.findById.mockResolvedValue(mockCourse);
		membershipPort.belongsToTenant.mockResolvedValue(true);
		subjectRepository.findByCourse.mockResolvedValue([]);

		await handler.execute(
			new CreateSubjectCommand(
				'course-1',
				'teacher-1',
				'Historia',
				'Sociales',
				3,
				undefined,
				'Laura Gómez',
			),
		);

		const saved = subjectRepository.save.mock.calls[0][0];
		expect(saved.teacherId).toBe('teacher-1');
		expect(saved.teacherName).toBeUndefined();
	});

	describe('teachers per commission', () => {
		const twoCommissions = [1, 2].map((number) =>
			WorkshopCommission.create({
				tenantId: 'tenant-1',
				courseId: 'course-1',
				number: number as 1 | 2,
			}),
		);
		const workshop = (teachers: CreateSubjectCommand['teachers']) =>
			new CreateSubjectCommand(
				'course-1',
				undefined,
				'Carpintería',
				'Taller',
				4,
				SUBJECT_KIND.WORKSHOP,
				undefined,
				teachers,
			);

		beforeEach(() => {
			courseRepository.findById.mockResolvedValue(mockCourse);
			membershipPort.belongsToTenant.mockResolvedValue(true);
			subjectRepository.findByCourse.mockResolvedValue([]);
			commissionRepository.findByCourse.mockResolvedValue(twoCommissions);
		});

		it('creates a workshop with one teacher per commission', async () => {
			await handler.execute(
				workshop([
					{ commissionNumber: 1, teacherId: 'teacher-a' },
					{ commissionNumber: 2, teacherName: 'Laura Gómez' },
				]),
			);

			const saved = subjectRepository.save.mock.calls[0][0];
			expect(saved.teachers.map((t) => [t.commissionNumber, t.teacherId])).toEqual(
				[
					[1, 'teacher-a'],
					[2, undefined],
				],
			);
			expect(saved.teacherId).toBe('teacher-a');
			expect(membershipPort.belongsToTenant).toHaveBeenCalledTimes(1);
			expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
		});

		it('lets teachers win over teacherId', async () => {
			await handler.execute(
				new CreateSubjectCommand(
					'course-1',
					'teacher-z',
					'Carpintería',
					'Taller',
					4,
					SUBJECT_KIND.WORKSHOP,
					undefined,
					[{ commissionNumber: 2, teacherId: 'teacher-b' }],
				),
			);

			const saved = subjectRepository.save.mock.calls[0][0];
			expect(saved.teacherIds).toEqual(['teacher-b']);
		});

		it('rejects a commission that the course does not have', async () => {
			commissionRepository.findByCourse.mockResolvedValue([]);

			await expectRejection(
				handler.execute(
					workshop([{ commissionNumber: 1, teacherId: 'teacher-a' }]),
				),
				BusinessRuleError,
				'El curso debe tener dos comisiones de taller para asignar un docente por comisión.',
			);
			expect(subjectRepository.save).not.toHaveBeenCalled();
		});

		it('rejects commission teachers on a theory subject', async () => {
			await expectRejection(
				handler.execute(
					new CreateSubjectCommand(
						'course-1',
						undefined,
						'Historia',
						'Sociales',
						3,
						undefined,
						undefined,
						[{ commissionNumber: 1, teacherId: 'teacher-a' }],
					),
				),
				DomainError,
				'Solo los talleres pueden tener un docente por comisión.',
			);
		});

		it('validates the tenant of every teacher', async () => {
			membershipPort.belongsToTenant.mockImplementation(
				async (id) => id !== 'teacher-b',
			);

			await expectRejection(
				handler.execute(
					workshop([
						{ commissionNumber: 1, teacherId: 'teacher-a' },
						{ commissionNumber: 2, teacherId: 'teacher-b' },
					]),
				),
				DomainError,
				'El profesor no pertenece a la institución.',
			);
		});
	});
});
