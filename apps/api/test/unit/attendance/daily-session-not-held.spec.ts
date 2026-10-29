import { EventEmitter2 } from '@nestjs/event-emitter';
import {
	ATTENDANCE_STATUS,
	LEVEL,
	WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE,
} from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { DomainError, NotFoundError } from '../../../src/common/errors';
import { BulkRegisterAttendanceCommand } from '../../../src/modules/attendance/application/commands/bulk-register-attendance/bulk-register-attendance.command';
import { BulkRegisterAttendanceHandler } from '../../../src/modules/attendance/application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { CopyDailyAttendanceCommand } from '../../../src/modules/attendance/application/commands/copy-daily-attendance/copy-daily-attendance.command';
import { CopyDailyAttendanceHandler } from '../../../src/modules/attendance/application/commands/copy-daily-attendance/copy-daily-attendance.handler';
import { MarkDailySessionNotHeldCommand } from '../../../src/modules/attendance/application/commands/mark-daily-session-not-held/mark-daily-session-not-held.command';
import { MarkDailySessionNotHeldHandler } from '../../../src/modules/attendance/application/commands/mark-daily-session-not-held/mark-daily-session-not-held.handler';
import { RegisterDailyAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.command';
import { RegisterDailyAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.handler';
import { UnmarkDailySessionNotHeldCommand } from '../../../src/modules/attendance/application/commands/unmark-daily-session-not-held/unmark-daily-session-not-held.command';
import { UnmarkDailySessionNotHeldHandler } from '../../../src/modules/attendance/application/commands/unmark-daily-session-not-held/unmark-daily-session-not-held.handler';
import { GetDailySessionNotHeldQueryHandler } from '../../../src/modules/attendance/application/queries/get-daily-session-not-held/get-daily-session-not-held.handler';
import { GetDailySessionNotHeldQuery } from '../../../src/modules/attendance/application/queries/get-daily-session-not-held/get-daily-session-not-held.query';
import { DAILY_SESSION_NOT_HELD_MESSAGE } from '../../../src/modules/attendance/application/services/daily-attendance.policy';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { DailySessionNotHeld } from '../../../src/modules/attendance/domain/entities/daily-session-not-held.entity';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IStudentPort } from '../../../src/modules/attendance/domain/ports/student.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { IDailySessionNotHeldRepository } from '../../../src/modules/attendance/domain/repositories/daily-session-not-held.repository.interface';

describe('daily session not held', () => {
	const date = new Date('2026-03-10');
	const regular = Course.reconstitute(
		'course-id',
		'6° A',
		'year-1',
		true,
		LEVEL.SECONDARY,
		6,
		undefined,
		'tenant-id',
	);
	const workshopOnly = Course.reconstitute(
		'course-id',
		'7° A',
		'year-1',
		true,
		LEVEL.SECONDARY,
		7,
		undefined,
		'tenant-id',
	);
	const buildMarker = (reason?: string) =>
		DailySessionNotHeld.create({
			tenantId: 'tenant-id',
			courseId: 'course-id',
			date,
			reason,
			createdBy: 'user-id',
		});

	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let notHeldRepo: MockProxy<IDailySessionNotHeldRepository>;
	let coursePort: MockProxy<ICoursePort>;
	let unitOfWork: MockProxy<IUnitOfWorkPort>;

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		notHeldRepo = mock<IDailySessionNotHeldRepository>();
		notHeldRepo.findByCourseAndDate.mockResolvedValue(null);
		coursePort = mock<ICoursePort>();
		coursePort.findById.mockResolvedValue(regular);
		unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation(async (work) => work());
	});

	describe('MarkDailySessionNotHeldHandler', () => {
		const run = (reason?: string) =>
			new MarkDailySessionNotHeldHandler(
				notHeldRepo,
				attendanceRepo,
				unitOfWork,
				coursePort,
			).execute(
				new MarkDailySessionNotHeldCommand(
					'tenant-id',
					'course-id',
					date,
					reason,
					'user-id',
				),
			);

		it('deletes the daily records of the day and saves the marker', async () => {
			attendanceRepo.deleteDailyByCourseAndDate.mockResolvedValue(3);

			const result = await run('Ausencia del docente');

			expect(result).toEqual({ deletedRecords: 3 });
			expect(attendanceRepo.deleteDailyByCourseAndDate).toHaveBeenCalledWith(
				'course-id',
				date,
			);
			expect(notHeldRepo.save).toHaveBeenCalledTimes(1);
			const saved = notHeldRepo.save.mock.calls[0][0];
			expect(saved.tenantId).toBe('tenant-id');
			expect(saved.courseId).toBe('course-id');
			expect(saved.date).toBe(date);
			expect(saved.reason).toBe('Ausencia del docente');
			expect(saved.createdBy).toBe('user-id');
		});

		it('runs the deletion and the marker inside one unit of work', async () => {
			attendanceRepo.deleteDailyByCourseAndDate.mockResolvedValue(0);

			await run();

			expect(unitOfWork.run).toHaveBeenCalledTimes(1);
		});

		it('stores a blank reason as no reason', async () => {
			attendanceRepo.deleteDailyByCourseAndDate.mockResolvedValue(0);

			await run('   ');

			expect(notHeldRepo.save.mock.calls[0][0].reason).toBeUndefined();
		});

		it('is idempotent: an already marked day only gets its reason updated', async () => {
			const existing = buildMarker('Viejo');
			notHeldRepo.findByCourseAndDate.mockResolvedValue(existing);
			attendanceRepo.deleteDailyByCourseAndDate.mockResolvedValue(0);

			const result = await run('Nuevo');

			expect(result).toEqual({ deletedRecords: 0 });
			expect(notHeldRepo.save).toHaveBeenCalledTimes(1);
			expect(notHeldRepo.save).toHaveBeenCalledWith(existing);
			expect(existing.reason).toBe('Nuevo');
		});

		it('does not save again when the day is already marked with the same reason', async () => {
			notHeldRepo.findByCourseAndDate.mockResolvedValue(buildMarker('Igual'));
			attendanceRepo.deleteDailyByCourseAndDate.mockResolvedValue(0);

			await run('Igual');

			expect(notHeldRepo.save).not.toHaveBeenCalled();
		});

		it('rejects a workshop-only course', async () => {
			coursePort.findById.mockResolvedValue(workshopOnly);

			const attempt = run();

			await expect(attempt).rejects.toBeInstanceOf(DomainError);
			await expect(attempt).rejects.toThrow(
				WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE,
			);
			expect(attendanceRepo.deleteDailyByCourseAndDate).not.toHaveBeenCalled();
			expect(notHeldRepo.save).not.toHaveBeenCalled();
		});

		it('reports a missing course as not found', async () => {
			coursePort.findById.mockResolvedValue(null);

			await expect(run()).rejects.toBeInstanceOf(NotFoundError);
			expect(attendanceRepo.deleteDailyByCourseAndDate).not.toHaveBeenCalled();
		});

		it('reports a course of another tenant as not found', async () => {
			coursePort.findById.mockResolvedValue(
				Course.reconstitute(
					'course-id',
					'6° A',
					'year-1',
					true,
					LEVEL.SECONDARY,
					6,
					undefined,
					'other-tenant',
				),
			);

			await expect(run()).rejects.toBeInstanceOf(NotFoundError);
			expect(attendanceRepo.deleteDailyByCourseAndDate).not.toHaveBeenCalled();
			expect(notHeldRepo.save).not.toHaveBeenCalled();
		});
	});

	describe('UnmarkDailySessionNotHeldHandler', () => {
		const run = (tenantId = 'tenant-id') =>
			new UnmarkDailySessionNotHeldHandler(notHeldRepo, coursePort).execute(
				new UnmarkDailySessionNotHeldCommand(tenantId, 'course-id', date),
			);

		it('removes the marker without restoring any record', async () => {
			await run();

			expect(notHeldRepo.delete).toHaveBeenCalledWith('course-id', date);
			expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
		});

		it('reports a course of another tenant as not found', async () => {
			await expect(run('other-tenant')).rejects.toBeInstanceOf(NotFoundError);
			expect(notHeldRepo.delete).not.toHaveBeenCalled();
		});

		it('reports a missing course as not found', async () => {
			coursePort.findById.mockResolvedValue(null);

			await expect(run()).rejects.toBeInstanceOf(NotFoundError);
		});
	});

	describe('GetDailySessionNotHeldQueryHandler', () => {
		const run = () =>
			new GetDailySessionNotHeldQueryHandler(notHeldRepo).execute(
				new GetDailySessionNotHeldQuery('course-id', date),
			);

		it('answers not held with the reason when the day is marked', async () => {
			notHeldRepo.findByCourseAndDate.mockResolvedValue(buildMarker('Paro'));

			expect(await run()).toEqual({ notHeld: true, reason: 'Paro' });
		});

		it('answers held when the day is not marked', async () => {
			const result = await run();

			expect(result.notHeld).toBe(false);
			expect(result.reason).toBeUndefined();
		});
	});

	describe('registering on a marked day', () => {
		let eventEmitter: MockProxy<EventEmitter2>;

		beforeEach(() => {
			eventEmitter = mock<EventEmitter2>();
			attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([]);
			attendanceRepo.findByStudentAndCourseAndDate.mockResolvedValue(null);
			attendanceRepo.findByCourseAndDate.mockResolvedValue([]);
		});

		const expectBlocked = async (attempt: Promise<unknown>) => {
			await expect(attempt).rejects.toBeInstanceOf(DomainError);
			await expect(attempt).rejects.toThrow(DAILY_SESSION_NOT_HELD_MESSAGE);
			expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
			expect(eventEmitter.emit).not.toHaveBeenCalled();
		};

		describe('RegisterDailyAttendanceHandler', () => {
			const run = () =>
				new RegisterDailyAttendanceHandler(
					attendanceRepo,
					unitOfWork,
					eventEmitter,
					coursePort,
					notHeldRepo,
				).execute(
					new RegisterDailyAttendanceCommand(
						'tenant-id',
						'course-id',
						date,
						[{ studentId: 'student-1', status: ATTENDANCE_STATUS.ABSENT }],
						'user-id',
					),
				);

			it('throws when the day is marked as not held', async () => {
				notHeldRepo.findByCourseAndDate.mockResolvedValue(buildMarker());

				await expectBlocked(run());
				expect(notHeldRepo.findByCourseAndDate).toHaveBeenCalledWith(
					'course-id',
					date,
				);
			});

			it('registers when the day is held', async () => {
				await run();

				expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
			});
		});

		describe('BulkRegisterAttendanceHandler', () => {
			const studentPort = mock<IStudentPort>();
			const run = () =>
				new BulkRegisterAttendanceHandler(
					attendanceRepo,
					eventEmitter,
					studentPort,
					coursePort,
					notHeldRepo,
				).execute(
					new BulkRegisterAttendanceCommand(
						'tenant-id',
						'course-id',
						date,
						ATTENDANCE_STATUS.PRESENT,
						'user-id',
					),
				);

			it('throws when the day is marked as not held', async () => {
				notHeldRepo.findByCourseAndDate.mockResolvedValue(buildMarker());

				await expectBlocked(run());
			});

			it('registers when the day is held', async () => {
				studentPort.getByCourseId.mockResolvedValue([]);

				await run();

				expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
			});
		});

		describe('CopyDailyAttendanceHandler', () => {
			const targetDate = new Date('2026-03-17');
			const run = () =>
				new CopyDailyAttendanceHandler(
					attendanceRepo,
					coursePort,
					notHeldRepo,
				).execute(
					new CopyDailyAttendanceCommand('user-id', 'course-id', targetDate, date),
				);

			it('throws when the target date is marked as not held', async () => {
				notHeldRepo.findByCourseAndDate.mockResolvedValue(buildMarker());

				await expectBlocked(run());
				expect(notHeldRepo.findByCourseAndDate).toHaveBeenCalledWith(
					'course-id',
					targetDate,
				);
			});

			it('copies when the target date is held', async () => {
				// No source records: the copy proceeds past the marker check.
				await expect(run()).rejects.toThrow(
					'No se encontraron registros para la fecha origen',
				);
			});
		});
	});
});
