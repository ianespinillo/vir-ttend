import {
	DAYOFWEEK,
	LEVEL,
	SHIFT,
	SUBJECT_KIND,
	SubjectKindType,
} from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { BusinessRuleError, DomainError } from '../../../../src/common/errors';
import { UpdateSubjectCommand } from '../../../../src/modules/academic/application/commands/update-subject/update-subject.command';
import { UpdateSubjectHandler } from '../../../../src/modules/academic/application/commands/update-subject/update-subject.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { WorkshopCommission } from '../../../../src/modules/academic/domain/entities/workshop-commission.entity';
import { IMembershipPort } from '../../../../src/modules/academic/domain/ports/membership.port.interface';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { IWorkshopCommissionRepository } from '../../../../src/modules/academic/domain/repositories/workshop-commission.repository.interface';
import { expectRejection } from '../expect-rejection';

describe('UpdateSubjectHandler', () => {
	let handler: UpdateSubjectHandler;
	let subjectRepo: MockProxy<ISubjectRepository>;
	let scheduleRepo: MockProxy<IScheduleRepository>;
	let courseRepo: MockProxy<ICourseRepository>;
	let membershipPort: MockProxy<IMembershipPort>;
	let commissionRepo: MockProxy<IWorkshopCommissionRepository>;

	const course = Course.reconstitute({
		id: 'course-1',
		tenantId: 'tenant-1',
		academicYearId: 'ay-1',
		preceptorId: 'preceptor-1',
		level: LEVEL.SECONDARY,
		yearNumber: 3,
		division: 'A',
		shift: SHIFT.MORNING,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const makeSubject = (kind: SubjectKindType) =>
		Subject.reconstitute({
			id: 'sub-1',
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: 'Original',
			area: 'AreaOriginal',
			weeklyHours: 4,
			kind,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

	const makeSlot = (commissionNumber: 1 | 2 | null) =>
		ScheduleSlot.create({
			subjectId: 'sub-1',
			courseId: 'course-1',
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '08:00',
			endTime: '09:00',
			commissionNumber,
		});

	const kindOnly = (kind: SubjectKindType) =>
		new UpdateSubjectCommand(
			'sub-1',
			undefined,
			undefined,
			undefined,
			undefined,
			kind,
		);

	beforeEach(() => {
		subjectRepo = mock<ISubjectRepository>();
		scheduleRepo = mock<IScheduleRepository>();
		courseRepo = mock<ICourseRepository>();
		membershipPort = mock<IMembershipPort>();
		commissionRepo = mock<IWorkshopCommissionRepository>();
		handler = new UpdateSubjectHandler(
			subjectRepo,
			scheduleRepo,
			courseRepo,
			membershipPort,
			commissionRepo,
		);
	});

	it('saves name and area in the right fields', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.THEORY));

		await handler.execute(
			new UpdateSubjectCommand('sub-1', undefined, 'Matemática', 'Exactas', 5),
		);

		const saved = subjectRepo.save.mock.calls[0][0];
		expect(saved.name).toBe('Matemática');
		expect(saved.area).toBe('Exactas');
		expect(saved.weeklyHours).toBe(5);
	});

	it('rejects workshop to theory when a slot has a commission', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.WORKSHOP));
		scheduleRepo.findBySubject.mockResolvedValue([makeSlot(null), makeSlot(1)]);

		await expectRejection(
			handler.execute(kindOnly(SUBJECT_KIND.THEORY)),
			BusinessRuleError,
			'La materia tiene horarios asignados a una comisión; quite la comisión de esos horarios antes de cambiarla a teoría.',
		);
		expect(subjectRepo.save).not.toHaveBeenCalled();
	});

	it('allows workshop to theory when no slot has a commission', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.WORKSHOP));
		scheduleRepo.findBySubject.mockResolvedValue([makeSlot(null)]);

		await handler.execute(kindOnly(SUBJECT_KIND.THEORY));

		expect(subjectRepo.save.mock.calls[0][0].kind).toBe(SUBJECT_KIND.THEORY);
	});

	it.each([
		[SUBJECT_KIND.WORKSHOP, SUBJECT_KIND.WORKSHOP],
		[SUBJECT_KIND.THEORY, SUBJECT_KIND.THEORY],
	])('does not block %s to %s', async (from, to) => {
		subjectRepo.findById.mockResolvedValue(makeSubject(from));
		scheduleRepo.findBySubject.mockResolvedValue([makeSlot(1)]);

		await handler.execute(kindOnly(to));

		expect(subjectRepo.save).toHaveBeenCalledTimes(1);
	});

	it('keeps the teacher when the update does not mention it', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.THEORY));

		await handler.execute(kindOnly(SUBJECT_KIND.THEORY));

		expect(subjectRepo.save.mock.calls[0][0].teacherId).toBe('teacher-1');
	});

	it('unassigns the teacher when "NONE" is sent without a manual name', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.THEORY));

		await handler.execute(new UpdateSubjectCommand('sub-1', 'NONE'));

		const saved = subjectRepo.save.mock.calls[0][0];
		expect(saved.teacherId).toBeUndefined();
		expect(saved.teacherName).toBeUndefined();
	});

	it('replaces the teacher account with a manual teacher name', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.THEORY));

		await handler.execute(
			new UpdateSubjectCommand(
				'sub-1',
				'NONE',
				undefined,
				undefined,
				undefined,
				undefined,
				'Laura Gómez',
			),
		);

		const saved = subjectRepo.save.mock.calls[0][0];
		expect(saved.teacherId).toBeUndefined();
		expect(saved.teacherName).toBe('Laura Gómez');
	});

	it('assigns a teacher account of the course institution and drops the manual name', async () => {
		subjectRepo.findById.mockResolvedValue(
			Subject.reconstitute({
				id: 'sub-1',
				courseId: 'course-1',
				teacherName: 'Laura Gómez',
				name: 'Original',
				area: 'AreaOriginal',
				weeklyHours: 4,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);
		courseRepo.findById.mockResolvedValue(course);
		membershipPort.belongsToTenant.mockResolvedValue(true);

		await handler.execute(new UpdateSubjectCommand('sub-1', 'teacher-2'));

		expect(membershipPort.belongsToTenant).toHaveBeenCalledWith(
			'teacher-2',
			'tenant-1',
		);
		const saved = subjectRepo.save.mock.calls[0][0];
		expect(saved.teacherId).toBe('teacher-2');
		expect(saved.teacherName).toBeUndefined();
	});

	it('rejects a teacher account from another institution', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.THEORY));
		courseRepo.findById.mockResolvedValue(course);
		membershipPort.belongsToTenant.mockResolvedValue(false);

		await expectRejection(
			handler.execute(new UpdateSubjectCommand('sub-1', 'teacher-x')),
			DomainError,
			'El profesor no pertenece a la institución.',
		);
		expect(subjectRepo.save).not.toHaveBeenCalled();
	});

	describe('teachers per commission', () => {
		const twoCommissions = [1, 2].map((number) =>
			WorkshopCommission.create({
				tenantId: 'tenant-1',
				courseId: 'course-1',
				number: number as 1 | 2,
			}),
		);
		const perCommission = new UpdateSubjectCommand(
			'sub-1',
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			[
				{ commissionNumber: 1, teacherId: 'teacher-a' },
				{ commissionNumber: 2, teacherId: 'teacher-b' },
			],
		);

		it('replaces the assignments with one teacher per commission', async () => {
			subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.WORKSHOP));
			courseRepo.findById.mockResolvedValue(course);
			membershipPort.belongsToTenant.mockResolvedValue(true);
			commissionRepo.findByCourse.mockResolvedValue(twoCommissions);

			await handler.execute(perCommission);

			const saved = subjectRepo.save.mock.calls[0][0];
			expect(saved.teachers.map((t) => [t.commissionNumber, t.teacherId])).toEqual(
				[
					[1, 'teacher-a'],
					[2, 'teacher-b'],
				],
			);
			expect(membershipPort.belongsToTenant).toHaveBeenCalledWith(
				'teacher-a',
				'tenant-1',
			);
			expect(membershipPort.belongsToTenant).toHaveBeenCalledWith(
				'teacher-b',
				'tenant-1',
			);
		});

		it('rejects a teacher of another institution in any commission', async () => {
			subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.WORKSHOP));
			courseRepo.findById.mockResolvedValue(course);
			membershipPort.belongsToTenant.mockImplementation(
				async (id) => id !== 'teacher-b',
			);
			commissionRepo.findByCourse.mockResolvedValue(twoCommissions);

			await expectRejection(
				handler.execute(perCommission),
				DomainError,
				'El profesor no pertenece a la institución.',
			);
			expect(subjectRepo.save).not.toHaveBeenCalled();
		});

		it('rejects commission teachers when the course has fewer than two commissions', async () => {
			subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.WORKSHOP));
			courseRepo.findById.mockResolvedValue(course);
			membershipPort.belongsToTenant.mockResolvedValue(true);
			commissionRepo.findByCourse.mockResolvedValue(twoCommissions.slice(0, 1));

			await expectRejection(
				handler.execute(perCommission),
				BusinessRuleError,
				'El curso debe tener dos comisiones de taller para asignar un docente por comisión.',
			);
			expect(subjectRepo.save).not.toHaveBeenCalled();
		});

		it('rejects commission teachers on a theory subject', async () => {
			subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.THEORY));
			courseRepo.findById.mockResolvedValue(course);
			membershipPort.belongsToTenant.mockResolvedValue(true);
			commissionRepo.findByCourse.mockResolvedValue(twoCommissions);

			await expectRejection(
				handler.execute(perCommission),
				DomainError,
				'Solo los talleres pueden tener un docente por comisión.',
			);
			expect(subjectRepo.save).not.toHaveBeenCalled();
		});

		it('accepts commission teachers together with the change to workshop', async () => {
			subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.THEORY));
			courseRepo.findById.mockResolvedValue(course);
			membershipPort.belongsToTenant.mockResolvedValue(true);
			commissionRepo.findByCourse.mockResolvedValue(twoCommissions);

			await handler.execute(
				new UpdateSubjectCommand(
					'sub-1',
					undefined,
					undefined,
					undefined,
					undefined,
					SUBJECT_KIND.WORKSHOP,
					undefined,
					perCommission.teachers,
				),
			);

			const saved = subjectRepo.save.mock.calls[0][0];
			expect(saved.kind).toBe(SUBJECT_KIND.WORKSHOP);
			expect(saved.hasCommissionTeachers).toBe(true);
		});

		it('a whole-subject teacherId replaces the commission teachers', async () => {
			subjectRepo.findById.mockResolvedValue(
				Subject.reconstitute({
					id: 'sub-1',
					courseId: 'course-1',
					kind: SUBJECT_KIND.WORKSHOP,
					teachers: [
						{ commissionNumber: 1, teacherId: 'teacher-a' },
						{ commissionNumber: 2, teacherId: 'teacher-b' },
					],
					name: 'Original',
					area: 'AreaOriginal',
					weeklyHours: 4,
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
			);
			courseRepo.findById.mockResolvedValue(course);
			membershipPort.belongsToTenant.mockResolvedValue(true);

			await handler.execute(new UpdateSubjectCommand('sub-1', 'teacher-c'));

			const saved = subjectRepo.save.mock.calls[0][0];
			expect(saved.teachers).toEqual([
				{
					commissionNumber: null,
					teacherId: 'teacher-c',
					teacherName: undefined,
				},
			]);
			expect(commissionRepo.findByCourse).not.toHaveBeenCalled();
		});
	});
});
