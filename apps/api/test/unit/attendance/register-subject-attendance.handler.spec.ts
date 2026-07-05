import { EventEmitter2 } from '@nestjs/event-emitter';
import { DAYOFWEEK } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { RegisterSubjectAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-subject-attendance/register-subject-attendance.command';
import { RegisterSubjectAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-subject-attendance/register-subject-attendance.handler';
import { ScheduleSlot } from '../../../src/modules/attendance/domain/entities/schedule-slot.entity';
import { ISchedulePort } from '../../../src/modules/attendance/domain/ports/schedule.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('RegisterSubjectAttendanceHandler', () => {
	let handler: RegisterSubjectAttendanceHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let schedulePort: MockProxy<ISchedulePort>;
	let eventEmitter: MockProxy<EventEmitter2>;
	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		schedulePort = mock<ISchedulePort>();
		eventEmitter = mock<EventEmitter2>();
		handler = new RegisterSubjectAttendanceHandler(
			attendanceRepo,
			schedulePort,
			eventEmitter,
		);
	});

	it('debe lanzar error si la fecha no es un día de clase para la materia', async () => {
		// Simulamos que la fecha enviada es un Martes (getDay() === 2)
		const tuesdayDate = new Date('2026-07-07T12:00:00Z');
		const command = new RegisterSubjectAttendanceCommand(
			'tenant-1',
			'user-1',
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
});
