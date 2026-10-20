import {
	CommissionNumber,
	DAYOFWEEK,
	LEVEL,
	ROLES,
	SHIFT,
	STUDENTSTATUS,
	StudentStatus,
} from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ForbiddenError, NotFoundError } from '../../../../src/common/errors';
import { GetSubjectStudentsHandler } from '../../../../src/modules/academic/application/queries/get-subject-students/get-subject-students.handler';
import { GetSubjectStudentsQuery } from '../../../../src/modules/academic/application/queries/get-subject-students/get-subject-students.query';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { WorkshopCommission } from '../../../../src/modules/academic/domain/entities/workshop-commission.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { IWorkshopCommissionRepository } from '../../../../src/modules/academic/domain/repositories/workshop-commission.repository.interface';
import { expectRejection } from '../expect-rejection';

describe('GetSubjectStudentsHandler', () => {
	let handler: GetSubjectStudentsHandler;
	let subjectRepo: MockProxy<ISubjectRepository>;
	let studentRepo: MockProxy<IStudentRepository>;
	let courseRepo: MockProxy<ICourseRepository>;
	let scheduleRepo: MockProxy<IScheduleRepository>;
	let commissionRepo: MockProxy<IWorkshopCommissionRepository>;

	const buildSlot = (
		dayOfWeek: DAYOFWEEK,
		commissionNumber: CommissionNumber | null,
	) =>
		ScheduleSlot.reconstitute({
			id: `slot-${dayOfWeek}-${commissionNumber}`,
			subjectId: 'sub-1',
			courseId: 'course-1',
			dayOfWeek,
			startTime: '08:00',
			endTime: '12:00',
			commissionNumber,
			createdAt: new Date(),
		});
	const buildCommission = (number: CommissionNumber) =>
		WorkshopCommission.reconstitute({
			id: `commission-${number}`,
			tenantId: 'tenant-1',
			courseId: 'course-1',
			number,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	const buildSubject = (deletedAt?: Date) =>
		Subject.reconstitute({
			id: 'sub-1',
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: 'Matemática',
			area: 'Ciencias',
			weeklyHours: 4,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt,
		});
	const buildStudent = (
		id: string,
		lastName: string,
		firstName: string,
		status: StudentStatus = STUDENTSTATUS.ACTIVE,
		tenantId = 'tenant-1',
	) =>
		Student.reconstitute({
			id,
			tenantId,
			courseId: 'course-1',
			firstName,
			lastName,
			documentNumber: `4523${id.replace(/\D/g, '').padStart(4, '0')}`,
			birthDate: new Date('2014-03-15'),
			tutorName: 'Tutor Name',
			tutorPhone: '1123456789',
			status,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	const course = Course.reconstitute({
		id: 'course-1',
		tenantId: 'tenant-1',
		academicYearId: 'year-1',
		preceptorId: 'preceptor-1',
		level: LEVEL.PRIMARY,
		yearNumber: 2,
		division: 'C',
		shift: SHIFT.AFTERNOON,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		subjectRepo = mock<ISubjectRepository>();
		studentRepo = mock<IStudentRepository>();
		courseRepo = mock<ICourseRepository>();
		scheduleRepo = mock<IScheduleRepository>();
		commissionRepo = mock<IWorkshopCommissionRepository>();
		handler = new GetSubjectStudentsHandler(
			subjectRepo,
			studentRepo,
			courseRepo,
			scheduleRepo,
			commissionRepo,
		);
		// Theory subject: its slots target the whole course.
		scheduleRepo.findBySubject.mockResolvedValue([
			buildSlot(DAYOFWEEK.MONDAY, null),
		]);
		commissionRepo.findByCourse.mockResolvedValue([
			buildCommission(1),
			buildCommission(2),
		]);
		studentRepo.findActiveByCommission.mockImplementation(async (id) =>
			id === 'commission-1'
				? [buildStudent('s-1', 'Garcia', 'Ana')]
				: [
						buildStudent('s-2', 'Perez', 'Zoe'),
						buildStudent('s-4', 'Ruiz', 'Eva', STUDENTSTATUS.ACTIVE, 'other-tenant'),
					],
		);
		subjectRepo.findById.mockResolvedValue(buildSubject());
		courseRepo.findById.mockResolvedValue(course);
		studentRepo.findByCourse.mockResolvedValue([
			buildStudent('s-2', 'Perez', 'Zoe'),
			buildStudent('s-1', 'Garcia', 'Ana'),
			buildStudent('s-3', 'Lopez', 'Leo', STUDENTSTATUS.TRANSFERRED),
			buildStudent('s-4', 'Ruiz', 'Eva', STUDENTSTATUS.ACTIVE, 'other-tenant'),
		]);
	});

	it.each([
		['the owner teacher', ROLES.TEACHER, 'teacher-1'],
		['an admin', ROLES.ADMIN, 'admin-1'],
		['a preceptor', ROLES.PRECEPTOR, 'preceptor-1'],
	])(
		'should return the active sorted roster for %s',
		async (_label, role, userId) => {
			const result = await handler.execute(
				new GetSubjectStudentsQuery('sub-1', 'tenant-1', userId, role),
			);

			expect(studentRepo.findByCourse).toHaveBeenCalledWith('course-1');
			expect(result.map((s) => s.id)).toEqual(['s-1', 's-2']);
			expect(result[0]).toMatchObject({
				firstName: 'Ana',
				lastName: 'Garcia',
				courseId: 'course-1',
				courseName: '2° C - AFTERNOON',
				status: STUDENTSTATUS.ACTIVE,
			});
		},
	);

	it('should return only the students of the commission a workshop subject targets', async () => {
		scheduleRepo.findBySubject.mockResolvedValue([
			buildSlot(DAYOFWEEK.MONDAY, 2),
			buildSlot(DAYOFWEEK.THURSDAY, 2),
		]);

		const result = await handler.execute(
			new GetSubjectStudentsQuery('sub-1', 'tenant-1', 'teacher-1', ROLES.TEACHER),
		);

		expect(studentRepo.findActiveByCommission).toHaveBeenCalledWith(
			'commission-2',
		);
		expect(studentRepo.findByCourse).not.toHaveBeenCalled();
		expect(result.map((s) => s.id)).toEqual(['s-2']);
		expect(result[0]).toMatchObject({ courseName: '2° C - AFTERNOON' });
	});

	it('should use the date weekday when slots are mixed, and the union without a date', async () => {
		scheduleRepo.findBySubject.mockResolvedValue([
			buildSlot(DAYOFWEEK.MONDAY, 1),
			buildSlot(DAYOFWEEK.WEDNESDAY, 2),
		]);
		const query = (date?: Date) =>
			new GetSubjectStudentsQuery(
				'sub-1',
				'tenant-1',
				'teacher-1',
				ROLES.TEACHER,
				date,
			);

		const monday = await handler.execute(query(new Date('2026-07-06')));
		const friday = await handler.execute(query(new Date('2026-07-10')));
		const noDate = await handler.execute(query());

		expect(monday.map((s) => s.id)).toEqual(['s-1']);
		expect(friday.map((s) => s.id)).toEqual(['s-1', 's-2']);
		expect(noDate.map((s) => s.id)).toEqual(['s-1', 's-2']);
	});

	it('should fall back to the whole course when the course has no commissions', async () => {
		scheduleRepo.findBySubject.mockResolvedValue([
			buildSlot(DAYOFWEEK.MONDAY, 1),
		]);
		commissionRepo.findByCourse.mockResolvedValue([]);

		const result = await handler.execute(
			new GetSubjectStudentsQuery('sub-1', 'tenant-1', 'admin-1', ROLES.ADMIN),
		);

		expect(studentRepo.findByCourse).toHaveBeenCalledWith('course-1');
		expect(result.map((s) => s.id)).toEqual(['s-1', 's-2']);
	});

	it('should throw ForbiddenError when a teacher asks for another teacher subject', async () => {
		await expectRejection(
			handler.execute(
				new GetSubjectStudentsQuery(
					'sub-1',
					'tenant-1',
					'teacher-2',
					ROLES.TEACHER,
				),
			),
			ForbiddenError,
			'La materia no está asignada a este docente.',
		);
		expect(studentRepo.findByCourse).not.toHaveBeenCalled();
	});

	it('should throw NotFoundError when the subject does not exist or is deleted', async () => {
		subjectRepo.findById.mockResolvedValueOnce(null);
		await expectRejection(
			handler.execute(
				new GetSubjectStudentsQuery('nope', 'tenant-1', 'admin-1', ROLES.ADMIN),
			),
			NotFoundError,
			'Materia no encontrada',
		);

		subjectRepo.findById.mockResolvedValueOnce(buildSubject(new Date()));
		await expectRejection(
			handler.execute(
				new GetSubjectStudentsQuery('sub-1', 'tenant-1', 'admin-1', ROLES.ADMIN),
			),
			NotFoundError,
			'Materia no encontrada',
		);
	});

	it('should throw ForbiddenError when the subject course belongs to another tenant', async () => {
		await expectRejection(
			handler.execute(
				new GetSubjectStudentsQuery(
					'sub-1',
					'other-tenant',
					'teacher-1',
					ROLES.TEACHER,
				),
			),
			ForbiddenError,
			'La materia no pertenece a su escuela.',
		);
		expect(studentRepo.findByCourse).not.toHaveBeenCalled();
	});
});
