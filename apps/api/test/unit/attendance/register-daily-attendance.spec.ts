import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
// register-daily-attendance.handler.spec.ts
import { RegisterDailyAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.command';
import { RegisterDailyAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.handler';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('RegisterDailyAttendanceHandler', () => {
	let handler: RegisterDailyAttendanceHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let unitOfWork: MockProxy<IUnitOfWorkPort>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const date = new Date('2025-03-10');
	const buildCommand = (
		records: { studentId: string; status: 'present' | 'absent' | 'late' }[],
	) =>
		new RegisterDailyAttendanceCommand(
			'tenant-id',
			'course-id',
			date,
			records,
			'user-id',
		);
	const buildExisting = (studentId: string, status: 'present' | 'absent') =>
		AttendanceRecord.reconstitute({
			id: `record-${studentId}`,
			tenantId: 'tenant-id',
			studentId,
			courseId: 'course-id',
			date,
			status,
			editedBy: 'user-id',
			editedAt: new Date('2025-03-10T08:00:00Z'),
			createdAt: new Date('2025-03-10T08:00:00Z'),
		});

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation(async (work) => work());
		eventEmitter = mock<EventEmitter2>();
		handler = new RegisterDailyAttendanceHandler(
			attendanceRepo,
			unitOfWork,
			eventEmitter,
			mock<ICoursePort>(),
		);
	});

	it('should create new records when none exist', async () => {
		attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([]);

		await handler.execute(
			buildCommand([
				{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
				{ studentId: 'student-2', status: ATTENDANCE_STATUS.ABSENT },
			]),
		);

		expect(attendanceRepo.findDailyByCourseAndDate).toHaveBeenCalledWith(
			'course-id',
			date,
		);
		expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved).toHaveLength(2);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
	});

	it('should update an existing record whose status changed and emit one event', async () => {
		const existing = buildExisting('student-1', ATTENDANCE_STATUS.PRESENT);
		attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([existing]);

		await handler.execute(
			buildCommand([{ studentId: 'student-1', status: ATTENDANCE_STATUS.ABSENT }]),
		);

		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved).toHaveLength(1);
		expect(saved[0].id).toBe('record-student-1');
		expect(saved[0].status).toBe(ATTENDANCE_STATUS.ABSENT);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'attendance.registered',
			expect.objectContaining({ attendance: saved[0] }),
		);
	});

	it('should run the read and the write inside the unit of work', async () => {
		attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([]);
		const order: string[] = [];
		unitOfWork.run.mockImplementation(async (work) => {
			order.push('begin');
			const result = await work();
			order.push('commit');
			return result;
		});
		attendanceRepo.findDailyByCourseAndDate.mockImplementation(async () => {
			order.push('read');
			return [];
		});
		attendanceRepo.bulkSave.mockImplementation(async () => {
			order.push('write');
		});
		eventEmitter.emit.mockImplementation(() => {
			order.push('event');
			return true;
		});

		await handler.execute(
			buildCommand([
				{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
			]),
		);

		expect(order).toEqual(['begin', 'read', 'write', 'commit', 'event']);
	});

	describe('replay (idempotency)', () => {
		it('should create nothing and emit nothing when replaying the same payload', async () => {
			const stored = new Map<string, AttendanceRecord>();
			attendanceRepo.findDailyByCourseAndDate.mockImplementation(async () => [
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
			expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
			expect(eventEmitter.emit).toHaveBeenCalledTimes(2);

			attendanceRepo.bulkSave.mockClear();
			eventEmitter.emit.mockClear();

			await handler.execute(command);

			expect(stored.size).toBe(2);
			expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
			expect(eventEmitter.emit).not.toHaveBeenCalled();
		});

		it('should only save and announce the records that changed', async () => {
			attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([
				buildExisting('student-1', ATTENDANCE_STATUS.PRESENT),
				buildExisting('student-2', ATTENDANCE_STATUS.PRESENT),
			]);

			await handler.execute(
				buildCommand([
					{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
					{ studentId: 'student-2', status: ATTENDANCE_STATUS.LATE },
					{ studentId: 'student-3', status: ATTENDANCE_STATUS.PRESENT },
				]),
			);

			const saved = attendanceRepo.bulkSave.mock.calls[0][0];
			expect(saved.map((r) => r.studentId)).toEqual(['student-2', 'student-3']);
			expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
		});

		it('should not touch an unchanged record', async () => {
			const existing = buildExisting('student-1', ATTENDANCE_STATUS.PRESENT);
			const originalEditedAt = existing.editedAt;
			attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([existing]);

			await handler.execute(
				buildCommand([
					{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
				]),
			);

			expect(existing.editedAt).toBe(originalEditedAt);
		});

		it('should keep the last entry when a student is repeated in the payload', async () => {
			attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([]);

			await handler.execute(
				buildCommand([
					{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
					{ studentId: 'student-1', status: ATTENDANCE_STATUS.ABSENT },
				]),
			);

			const saved = attendanceRepo.bulkSave.mock.calls[0][0];
			expect(saved).toHaveLength(1);
			expect(saved[0].status).toBe(ATTENDANCE_STATUS.ABSENT);
			expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
		});
	});

	it('should not emit events when the unit of work fails', async () => {
		attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([]);
		attendanceRepo.bulkSave.mockRejectedValue(new Error('db down'));

		await expect(
			handler.execute(
				buildCommand([
					{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
				]),
			),
		).rejects.toThrow('db down');
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});
});
