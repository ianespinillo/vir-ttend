import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import {
	LEVEL,
	ROLES,
	SHIFT,
	STUDENTSTATUS,
	StudentStatus,
} from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { AssignWorkshopPreceptorCommand } from '../../../../src/modules/academic/application/commands/assign-workshop-preceptor/assign-workshop-preceptor.command';
import { AssignWorkshopPreceptorHandler } from '../../../../src/modules/academic/application/commands/assign-workshop-preceptor/assign-workshop-preceptor.handler';
import { CreateWorkshopCommissionsCommand } from '../../../../src/modules/academic/application/commands/create-workshop-commissions/create-workshop-commissions.command';
import { CreateWorkshopCommissionsHandler } from '../../../../src/modules/academic/application/commands/create-workshop-commissions/create-workshop-commissions.handler';
import { MoveStudentToCommissionCommand } from '../../../../src/modules/academic/application/commands/move-student-to-commission/move-student-to-commission.command';
import { MoveStudentToCommissionHandler } from '../../../../src/modules/academic/application/commands/move-student-to-commission/move-student-to-commission.handler';
import { RegenerateWorkshopCommissionsCommand } from '../../../../src/modules/academic/application/commands/regenerate-workshop-commissions/regenerate-workshop-commissions.command';
import { RegenerateWorkshopCommissionsHandler } from '../../../../src/modules/academic/application/commands/regenerate-workshop-commissions/regenerate-workshop-commissions.handler';
import { GetWorkshopCommissionsHandler } from '../../../../src/modules/academic/application/queries/get-workshop-commissions/get-workshop-commissions.handler';
import { GetWorkshopCommissionsQuery } from '../../../../src/modules/academic/application/queries/get-workshop-commissions/get-workshop-commissions.query';
import { WorkshopPlacementService } from '../../../../src/modules/academic/application/services/workshop-placement.service';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { WorkshopCommission } from '../../../../src/modules/academic/domain/entities/workshop-commission.entity';
import { IMembershipPort } from '../../../../src/modules/academic/domain/ports/membership.port.interface';
import { IAcademicUnitOfWorkPort } from '../../../../src/modules/academic/domain/ports/unit-of-work.port.interface';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';
import { IWorkshopCommissionRepository } from '../../../../src/modules/academic/domain/repositories/workshop-commission.repository.interface';

const TENANT = 'tenant-1';
const now = new Date();

const course = Course.reconstitute({
	id: 'course-1',
	tenantId: TENANT,
	academicYearId: 'ay-1',
	preceptorId: 'course-preceptor',
	level: LEVEL.SECONDARY,
	yearNumber: 1,
	division: '4',
	shift: SHIFT.MORNING,
	isActive: true,
	createdAt: now,
	updatedAt: now,
});

const student = (
	id: string,
	lastName: string,
	opts: {
		courseId?: string;
		status?: StudentStatus;
		commissionId?: string | null;
	} = {},
) =>
	Student.reconstitute({
		id,
		tenantId: TENANT,
		courseId: opts.courseId ?? 'course-1',
		firstName: 'Ana',
		lastName,
		documentNumber: `4${String(id.charCodeAt(0)).padStart(7, '0')}`,
		birthDate: new Date('2010-01-01'),
		tutorName: 'Maria Garcia',
		tutorPhone: '1123456789',
		status: opts.status ?? STUDENTSTATUS.ACTIVE,
		workshopCommissionId: opts.commissionId ?? null,
		createdAt: now,
		updatedAt: now,
	});

const commission = (
	number: 1 | 2,
	extra: { preceptorId?: string | null; tenantId?: string } = {},
) =>
	WorkshopCommission.reconstitute({
		id: `commission-${number}`,
		tenantId: extra.tenantId ?? TENANT,
		courseId: 'course-1',
		number,
		preceptorId: extra.preceptorId ?? null,
		createdAt: now,
		updatedAt: now,
	});

describe('workshop commission handlers', () => {
	let courseRepo: MockProxy<ICourseRepository>;
	let studentRepo: MockProxy<IStudentRepository>;
	let commissionRepo: MockProxy<IWorkshopCommissionRepository>;
	let memberPort: MockProxy<IMembershipPort>;
	const unitOfWork: IAcademicUnitOfWorkPort = { run: (work) => work() };
	let placement: WorkshopPlacementService;

	beforeEach(() => {
		courseRepo = mock<ICourseRepository>();
		studentRepo = mock<IStudentRepository>();
		commissionRepo = mock<IWorkshopCommissionRepository>();
		memberPort = mock<IMembershipPort>();
		placement = new WorkshopPlacementService(studentRepo, commissionRepo);
		courseRepo.findById.mockResolvedValue(course);
	});

	describe('create', () => {
		let handler: CreateWorkshopCommissionsHandler;
		beforeEach(() => {
			handler = new CreateWorkshopCommissionsHandler(
				courseRepo,
				studentRepo,
				commissionRepo,
				unitOfWork,
				placement,
			);
			commissionRepo.findByCourse.mockResolvedValue([]);
		});

		it('creates both commissions and splits active students alphabetically (5 -> 3/2)', async () => {
			studentRepo.findActiveByCourse.mockResolvedValue([
				student('e', 'Zapata'),
				student('b', 'alvarez'),
				student('d', 'Perez'),
				student('a', 'Álvarez'),
				student('c', 'Gomez'),
			]);

			const result = await handler.execute(
				new CreateWorkshopCommissionsCommand('course-1', TENANT),
			);

			expect(commissionRepo.save).toHaveBeenCalledTimes(2);
			expect(result.map((c) => [c.code, c.number, c.studentCount])).toEqual([
				['141', 1, 3],
				['142', 2, 2],
			]);
			expect(result[0].students.map((s) => s.lastName)).toEqual([
				'alvarez',
				'Álvarez',
				'Gomez',
			]);
			expect(result[1].students.map((s) => s.lastName)).toEqual([
				'Perez',
				'Zapata',
			]);
			expect(studentRepo.save).toHaveBeenCalledTimes(5);
		});

		it('creates a single commission with every active student when count is 1', async () => {
			studentRepo.findActiveByCourse.mockResolvedValue([
				student('c', 'Zapata'),
				student('a', 'Alvarez'),
				student('b', 'Gomez'),
			]);

			const result = await handler.execute(
				new CreateWorkshopCommissionsCommand('course-1', TENANT, 1),
			);

			expect(commissionRepo.save).toHaveBeenCalledTimes(1);
			expect(result.map((c) => [c.code, c.number, c.studentCount])).toEqual([
				['141', 1, 3],
			]);
			expect(result[0].students.map((s) => s.lastName)).toEqual([
				'Alvarez',
				'Gomez',
				'Zapata',
			]);
			expect(studentRepo.save).toHaveBeenCalledTimes(3);
		});

		it('rejects a commission count other than 1 or 2', async () => {
			await expect(
				handler.execute(
					new CreateWorkshopCommissionsCommand(
						'course-1',
						TENANT,
						3 as unknown as 1,
					),
				),
			).rejects.toThrow(BadRequestException);
			expect(commissionRepo.save).not.toHaveBeenCalled();
		});

		it('rejects with 409 when the course already has commissions', async () => {
			commissionRepo.findByCourse.mockResolvedValue([
				commission(1),
				commission(2),
			]);
			await expect(
				handler.execute(new CreateWorkshopCommissionsCommand('course-1', TENANT)),
			).rejects.toThrow(ConflictException);
			expect(commissionRepo.save).not.toHaveBeenCalled();
		});

		it('returns 404 for a course of another tenant', async () => {
			await expect(
				handler.execute(
					new CreateWorkshopCommissionsCommand('course-1', 'other-tenant'),
				),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('regenerate', () => {
		let handler: RegenerateWorkshopCommissionsHandler;
		beforeEach(() => {
			handler = new RegenerateWorkshopCommissionsHandler(
				courseRepo,
				studentRepo,
				commissionRepo,
				unitOfWork,
				placement,
			);
			commissionRepo.findByCourse.mockResolvedValue([
				commission(1),
				commission(2),
			]);
		});

		it('rejects without confirmation', async () => {
			await expect(
				handler.execute(
					new RegenerateWorkshopCommissionsCommand('course-1', TENANT, false),
				),
			).rejects.toThrow(BadRequestException);
			expect(studentRepo.save).not.toHaveBeenCalled();
		});

		it('re-splits all active students and only saves the ones that move', async () => {
			studentRepo.findActiveByCourse.mockResolvedValue([
				student('a', 'Alvarez', { commissionId: 'commission-1' }),
				student('b', 'Benitez', { commissionId: 'commission-1' }),
				student('c', 'Castro', { commissionId: 'commission-1' }),
				student('d', 'Diaz', { commissionId: 'commission-2' }),
			]);

			const result = await handler.execute(
				new RegenerateWorkshopCommissionsCommand('course-1', TENANT, true),
			);

			expect(result.map((c) => c.studentCount)).toEqual([2, 2]);
			expect(studentRepo.save).toHaveBeenCalledTimes(1);
			expect(studentRepo.save.mock.calls[0][0].id).toBe('c');
			expect(studentRepo.save.mock.calls[0][0].workshopCommissionId).toBe(
				'commission-2',
			);
		});

		it('keeps a single commission: every active student goes to it', async () => {
			commissionRepo.findByCourse.mockResolvedValue([commission(1)]);
			studentRepo.findActiveByCourse.mockResolvedValue([
				student('a', 'Alvarez', { commissionId: 'commission-1' }),
				student('b', 'Benitez'),
				student('c', 'Castro', { commissionId: 'commission-1' }),
			]);

			const result = await handler.execute(
				new RegenerateWorkshopCommissionsCommand('course-1', TENANT, true),
			);

			expect(commissionRepo.save).not.toHaveBeenCalled();
			expect(result.map((c) => [c.number, c.studentCount])).toEqual([[1, 3]]);
			expect(studentRepo.save).toHaveBeenCalledTimes(1);
			expect(studentRepo.save.mock.calls[0][0].id).toBe('b');
		});

		it('returns 404 when the course has no commissions', async () => {
			commissionRepo.findByCourse.mockResolvedValue([]);
			await expect(
				handler.execute(
					new RegenerateWorkshopCommissionsCommand('course-1', TENANT, true),
				),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('assign preceptor', () => {
		let handler: AssignWorkshopPreceptorHandler;
		beforeEach(() => {
			handler = new AssignWorkshopPreceptorHandler(commissionRepo, memberPort);
			commissionRepo.findById.mockResolvedValue(
				commission(1, { preceptorId: 'old' }),
			);
		});

		it('assigns a tenant preceptor', async () => {
			memberPort.belongsToTenant.mockResolvedValue(true);
			memberPort.existsAndHasRole.mockResolvedValue(true);
			await handler.execute(
				new AssignWorkshopPreceptorCommand('commission-1', TENANT, 'user-1'),
			);
			expect(memberPort.existsAndHasRole).toHaveBeenCalledWith(
				'user-1',
				TENANT,
				ROLES.PRECEPTOR,
			);
			expect(commissionRepo.save.mock.calls[0][0].preceptorId).toBe('user-1');
		});

		it('rejects a user that is not a preceptor', async () => {
			memberPort.belongsToTenant.mockResolvedValue(true);
			memberPort.existsAndHasRole.mockResolvedValue(false);
			await expect(
				handler.execute(
					new AssignWorkshopPreceptorCommand('commission-1', TENANT, 'teacher'),
				),
			).rejects.toThrow(BadRequestException);
			expect(commissionRepo.save).not.toHaveBeenCalled();
		});

		it('rejects a user outside the tenant', async () => {
			memberPort.belongsToTenant.mockResolvedValue(false);
			await expect(
				handler.execute(
					new AssignWorkshopPreceptorCommand('commission-1', TENANT, 'stranger'),
				),
			).rejects.toThrow(BadRequestException);
		});

		it('unassigns with null without checking membership', async () => {
			await handler.execute(
				new AssignWorkshopPreceptorCommand('commission-1', TENANT, null),
			);
			expect(memberPort.belongsToTenant).not.toHaveBeenCalled();
			expect(commissionRepo.save.mock.calls[0][0].preceptorId).toBeNull();
		});

		it('returns 404 for a commission of another tenant', async () => {
			commissionRepo.findById.mockResolvedValue(
				commission(1, { tenantId: 'other' }),
			);
			await expect(
				handler.execute(
					new AssignWorkshopPreceptorCommand('commission-1', TENANT, null),
				),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('move student', () => {
		let handler: MoveStudentToCommissionHandler;
		beforeEach(() => {
			handler = new MoveStudentToCommissionHandler(commissionRepo, studentRepo);
			commissionRepo.findById.mockResolvedValue(commission(2));
		});

		it('moves an active student of the course', async () => {
			studentRepo.findById.mockResolvedValue(
				student('a', 'Alvarez', { commissionId: 'commission-1' }),
			);
			await handler.execute(
				new MoveStudentToCommissionCommand('commission-2', 'a', TENANT),
			);
			expect(studentRepo.save.mock.calls[0][0].workshopCommissionId).toBe(
				'commission-2',
			);
		});

		it('is idempotent when the student is already there', async () => {
			studentRepo.findById.mockResolvedValue(
				student('a', 'Alvarez', { commissionId: 'commission-2' }),
			);
			await handler.execute(
				new MoveStudentToCommissionCommand('commission-2', 'a', TENANT),
			);
			expect(studentRepo.save).not.toHaveBeenCalled();
		});

		it('rejects a student from another course', async () => {
			studentRepo.findById.mockResolvedValue(
				student('a', 'Alvarez', { courseId: 'course-2' }),
			);
			await expect(
				handler.execute(
					new MoveStudentToCommissionCommand('commission-2', 'a', TENANT),
				),
			).rejects.toThrow(BadRequestException);
		});

		it('rejects an inactive student', async () => {
			studentRepo.findById.mockResolvedValue(
				student('a', 'Alvarez', { status: STUDENTSTATUS.INACTIVE }),
			);
			await expect(
				handler.execute(
					new MoveStudentToCommissionCommand('commission-2', 'a', TENANT),
				),
			).rejects.toThrow(BadRequestException);
		});

		it('returns 404 for an unknown student', async () => {
			studentRepo.findById.mockResolvedValue(null);
			await expect(
				handler.execute(
					new MoveStudentToCommissionCommand('commission-2', 'a', TENANT),
				),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('get', () => {
		let handler: GetWorkshopCommissionsHandler;
		beforeEach(() => {
			handler = new GetWorkshopCommissionsHandler(
				courseRepo,
				studentRepo,
				commissionRepo,
			);
		});

		it('returns an empty list when the course has no commissions', async () => {
			commissionRepo.findByCourse.mockResolvedValue([]);
			await expect(
				handler.execute(
					new GetWorkshopCommissionsQuery('course-1', TENANT, 'u', ROLES.ADMIN),
				),
			).resolves.toEqual([]);
		});

		it('groups sorted students per commission', async () => {
			commissionRepo.findByCourse.mockResolvedValue([
				commission(1, { preceptorId: 'p1' }),
				commission(2),
			]);
			studentRepo.findActiveByCourse.mockResolvedValue([
				student('b', 'Zeta', { commissionId: 'commission-1' }),
				student('a', 'Alfa', { commissionId: 'commission-1' }),
				student('c', 'Mora', { commissionId: 'commission-2' }),
			]);
			const result = await handler.execute(
				new GetWorkshopCommissionsQuery('course-1', TENANT, 'u', ROLES.ADMIN),
			);
			expect(result[0]).toMatchObject({ code: '141', preceptorId: 'p1' });
			expect(result[0].students.map((s) => s.id)).toEqual(['a', 'b']);
			expect(result[1].students.map((s) => s.id)).toEqual(['c']);
		});

		it('allows the course and commission preceptors, rejects unrelated ones', async () => {
			commissionRepo.findByCourse.mockResolvedValue([
				commission(1, { preceptorId: 'workshop-p' }),
				commission(2),
			]);
			studentRepo.findActiveByCourse.mockResolvedValue([]);
			const as = (userId: string) =>
				handler.execute(
					new GetWorkshopCommissionsQuery(
						'course-1',
						TENANT,
						userId,
						ROLES.PRECEPTOR,
					),
				);
			await expect(as('workshop-p')).resolves.toHaveLength(2);
			await expect(as('course-preceptor')).resolves.toHaveLength(2);
			await expect(as('stranger')).rejects.toThrow(ForbiddenException);
		});
	});

	describe('placement of new students', () => {
		beforeEach(() => {
			commissionRepo.findByCourse.mockResolvedValue([
				commission(2),
				commission(1),
			]);
		});

		const place = async (first: number, second: number) => {
			studentRepo.countActiveByCommission.mockImplementation(async (id) =>
				id === 'commission-1' ? first : second,
			);
			const s = student('new', 'Nuevo');
			await placement.placeNewStudent(s);
			return s.workshopCommissionId;
		};

		it('goes to the commission with fewer active students', async () => {
			await expect(place(3, 2)).resolves.toBe('commission-2');
			await expect(place(2, 3)).resolves.toBe('commission-1');
		});

		it('goes to commission 1 on ties', async () => {
			await expect(place(2, 2)).resolves.toBe('commission-1');
		});

		it('goes to the only commission when the course has one', async () => {
			commissionRepo.findByCourse.mockResolvedValue([commission(1)]);
			const s = student('new', 'Nuevo');
			await placement.placeNewStudent(s);
			expect(s.workshopCommissionId).toBe('commission-1');
			expect(studentRepo.countActiveByCommission).not.toHaveBeenCalled();
		});

		it('gets no commission when the course has none', async () => {
			commissionRepo.findByCourse.mockResolvedValue([]);
			const s = student('new', 'Nuevo');
			await placement.placeNewStudent(s);
			expect(s.workshopCommissionId).toBeNull();
			expect(studentRepo.countActiveByCommission).not.toHaveBeenCalled();
		});
	});
});
