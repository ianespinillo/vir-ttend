import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS, DAYOFWEEK, ROLES, Roles } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { RegisterSubjectAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-subject-attendance/register-subject-attendance.command';
import { RegisterSubjectAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-subject-attendance/register-subject-attendance.handler';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { ScheduleSlot } from '../../../src/modules/attendance/domain/entities/schedule-slot.entity';
import { Subject } from '../../../src/modules/attendance/domain/entities/subject.entity';
import { ISchedulePort } from '../../../src/modules/attendance/domain/ports/schedule.port.interface';
import { ISubjectPort } from '../../../src/modules/attendance/domain/ports/subject.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('RegisterSubjectAttendanceHandler', () => {
	let handler: RegisterSubjectAttendanceHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let schedulePort: MockProxy<ISchedulePort>;
	let subjectPort: MockProxy<ISubjectPort>;
	let unitOfWork: MockProxy<IUnitOfWorkPort>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const mondayDate = new Date('2026-07-06T12:00:00Z');
	const buildCommand = (
		records: { studentId: string; status: 'present' | 'absent' | 'late' }[],
		userId = 'user-1',
		userRole: Roles = ROLES.TEACHER,
		date = mondayDate,
	) =>
		new RegisterSubjectAttendanceCommand(
			'tenant-1',
			userId,
			userRole,
			'sub-1',
			'course-1',
			date,
			records,
		);
	const buildExisting = (studentId: string, status: 'present' | 'absent') =>
		AttendanceRecord.reconstitute({
			id: `record-${studentId}`,
			tenantId: 'tenant-1',
			studentId,
			courseId: 'course-1',
			subjectId: 'sub-1',
			date: mondayDate,
			status,
			editedBy: 'user-1',
			editedAt: new Date('2026-07-06T08:00:00Z'),
			createdAt: new Date('2026-07-06T08:00:00Z'),
		});

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		schedulePort = mock<ISchedulePort>();
		subjectPort = mock<ISubjectPort>();
		subjectPort.getSubjectById.mockResolvedValue(
			Subject.reconstitute('sub-1', 'course-1', 'Math', 'user-1'),
		);
		unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation(async (work) => work());
		eventEmitter = mock<EventEmitter2>();
		handler = new RegisterSubjectAttendanceHandler(
			attendanceRepo,
			schedulePort,
			subjectPort,
			unitOfWork,
			eventEmitter,
		);
		schedulePort.findBySubject.mockResolvedValue([
			ScheduleSlot.reconstitute('sub-1', DAYOFWEEK.MONDAY, '08:00', '09:00'),
		]);
	});

	it('debe lanzar error si la fecha no es un día de clase para la materia', async () => {
		// Simulamos que la fecha enviada es un Martes (getDay() === 2)
		const tuesdayDate = new Date('2026-07-07T12:00:00Z');
		const command = new RegisterSubjectAttendanceCommand(
			'tenant-1',
			'user-1',
			ROLES.TEACHER,
			'sub-1',
			'course-1',
			tuesdayDate,
			[],
		);

		// Simulamos que la materia solo se dicta Lunes y Miércoles
		schedulePort.findBySubject.mockResolvedValue([
			ScheduleSlot.reconstitute('sub-1', DAYOFWEEK.MONDAY, '08:00', '09:00'),
			ScheduleSlot.reconstitute('sub-1', DAYOFWEEK.WEDNESDAY, '08:00', '09:00'),
		]);

		await expect(handler.execute(command)).rejects.toThrow(
			'Invalid class day for this subject',
		);
		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
	});

	it('should create subject records scoped to the subject when none exist', async () => {
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);

		await handler.execute(
			buildCommand([
				{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
			]),
		);

		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved).toHaveLength(1);
		expect(saved[0].subjectId).toBe('sub-1');
		expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
	});

	it('should update (and not duplicate) an existing record whose status changed', async () => {
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([
			buildExisting('student-1', ATTENDANCE_STATUS.PRESENT),
		]);

		await handler.execute(
			buildCommand([{ studentId: 'student-1', status: ATTENDANCE_STATUS.ABSENT }]),
		);

		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved).toHaveLength(1);
		expect(saved[0].id).toBe('record-student-1');
		expect(saved[0].status).toBe(ATTENDANCE_STATUS.ABSENT);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
	});

	it('should save nothing and emit nothing when replaying the same payload', async () => {
		const stored = new Map<string, AttendanceRecord>();
		attendanceRepo.findBySubjectAndDate.mockImplementation(async () => [
			...stored.values(),
		]);
		attendanceRepo.bulkSave.mockImplementation(async (records) => {
			for (const record of records) stored.set(record.studentId, record);
		});
		const command = buildCommand([
			{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
			{ studentId: 'student-2', status: ATTENDANCE_STATUS.ABSENT },
		]);

		await handler.execute(command);
		attendanceRepo.bulkSave.mockClear();
		eventEmitter.emit.mockClear();

		await handler.execute(command);

		expect(stored.size).toBe(2);
		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	describe('ownership', () => {
		const payload = [
			{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
		];

		it('should reject a teacher who does not teach the subject', async () => {
			await expect(
				handler.execute(buildCommand(payload, 'other-teacher', ROLES.TEACHER)),
			).rejects.toThrow(ForbiddenException);

			expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
			expect(eventEmitter.emit).not.toHaveBeenCalled();
		});

		it('should reject a preceptor, who can only read subject attendance', async () => {
			await expect(
				handler.execute(buildCommand(payload, 'preceptor-1', ROLES.PRECEPTOR)),
			).rejects.toThrow(ForbiddenException);
		});

		it('should allow the owner teacher', async () => {
			attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);

			await handler.execute(buildCommand(payload, 'user-1', ROLES.TEACHER));

			expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		});

		it('should allow an admin regardless of the assigned teacher', async () => {
			attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);

			await handler.execute(buildCommand(payload, 'admin-1', ROLES.ADMIN));

			expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		});

		it('should fail with a bad request when the subject does not exist', async () => {
			subjectPort.getSubjectById.mockResolvedValue(null);

			await expect(handler.execute(buildCommand(payload))).rejects.toThrow(
				'Invalid subject id',
			);
		});

		it('should reject when the subject belongs to another tenant', async () => {
			subjectPort.getSubjectById.mockResolvedValue(
				Subject.reconstitute('sub-1', 'course-1', 'Math', 'user-1', 'other-tenant'),
			);

			await expect(handler.execute(buildCommand(payload))).rejects.toThrow(
				ForbiddenException,
			);
			expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
		});

		it('should reject when courseId does not match subject courseId', async () => {
			const mismatched = new RegisterSubjectAttendanceCommand(
				'tenant-1',
				'user-1',
				ROLES.TEACHER,
				'sub-1',
				'wrong-course',
				mondayDate,
				payload,
			);

			await expect(handler.execute(mismatched)).rejects.toThrow(
				'Course does not match subject',
			);
			expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
		});
	});

	describe('class day', () => {
		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should read the weekday from the calendar date in UTC, not the server timezone', async () => {
			attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);
			// A date-only string parses as UTC midnight: Monday 2026-07-06. On a
			// server west of UTC the local day is still Sunday, so getDay() would
			// reject it. Force that behaviour to prove it is not consulted.
			jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0);

			await handler.execute(
				buildCommand(
					[{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT }],
					'user-1',
					ROLES.TEACHER,
					new Date('2026-07-06'),
				),
			);

			expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		});

		it('should reject a non-class calendar date even if the server-local day would match', async () => {
			// 2026-07-07 is a Tuesday and the subject only meets on Mondays. On a
			// server east of UTC the local day could read Monday; getDay() must not
			// decide the outcome.
			jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1);

			await expect(
				handler.execute(
					buildCommand(
						[{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT }],
						'user-1',
						ROLES.TEACHER,
						new Date('2026-07-07'),
					),
				),
			).rejects.toThrow('Invalid class day for this subject');
		});

		it('should reject weekends', async () => {
			await expect(
				handler.execute(
					buildCommand([], 'user-1', ROLES.TEACHER, new Date('2026-07-05')),
				),
			).rejects.toThrow('Invalid class day for this subject');
		});
	});
});
