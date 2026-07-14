import { ATTENDANCE_STATUS } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GenerateAlertHandler } from '../../../src/modules/attendance/application/commands/generate-alert/generate-alert.handler';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { AttendanceRegisteredEvent } from '../../../src/modules/attendance/domain/events/attendance-registered.event';
import { IAcademicYearPort } from '../../../src/modules/attendance/domain/ports/academic-year.port.interface';
import { AttendanceRegisteredListener } from '../../../src/modules/attendance/infrastructure/events/attendance-registered.listener';

describe('AttendanceRegisteredListener', () => {
	let listener: AttendanceRegisteredListener;
	let academicYearPort: MockProxy<IAcademicYearPort>;
	let generateAlertHandler: MockProxy<GenerateAlertHandler>;

	const year = AcademicYear.reconstitute(
		'year-1',
		85,
		30,
		new Date('2026-03-01'),
		new Date('2026-12-31'),
	);

	beforeEach(() => {
		academicYearPort = mock<IAcademicYearPort>();
		generateAlertHandler = mock<GenerateAlertHandler>();
		academicYearPort.findByCourseId.mockResolvedValue(year);
		generateAlertHandler.execute.mockResolvedValue(undefined);
		listener = new AttendanceRegisteredListener(
			academicYearPort,
			generateAlertHandler,
		);
	});

	const makeEvent = (overrides?: {
		courseId?: string;
		studentId?: string;
		tenantId?: string;
	}) =>
		new AttendanceRegisteredEvent(
			new Date(),
			AttendanceRecord.reconstitute({
				id: 'rec-1',
				tenantId: overrides?.tenantId ?? 'tenant-1',
				studentId: overrides?.studentId ?? 'student-1',
				courseId: overrides?.courseId ?? 'course-1',
				date: new Date(),
				status: ATTENDANCE_STATUS.ABSENT,
				editedBy: 'user-1',
				editedAt: new Date(),
				createdAt: new Date(),
			}),
		);

	it('ejecuta GenerateAlertHandler al recibir el evento', async () => {
		const event = makeEvent();
		await listener.attendanceRegistered(event);
		expect(generateAlertHandler.execute).toHaveBeenCalledTimes(1);
	});

	it('pasa los datos correctos al GenerateAlertCommand', async () => {
		const event = makeEvent({
			courseId: 'course-42',
			studentId: 'student-99',
			tenantId: 'tenant-7',
		});
		await listener.attendanceRegistered(event);
		expect(generateAlertHandler.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				studentId: 'student-99',
				courseId: 'course-42',
				academicYearId: 'year-1',
				tenantId: 'tenant-7',
			}),
		);
	});

	it('no ejecuta GenerateAlertHandler si no encuentra el academic year', async () => {
		academicYearPort.findByCourseId.mockResolvedValue(null);
		const event = makeEvent();
		await listener.attendanceRegistered(event);
		expect(generateAlertHandler.execute).not.toHaveBeenCalled();
	});

	it('resuelve el academic year a partir del courseId del evento', async () => {
		const event = makeEvent({ courseId: 'course-55' });
		await listener.attendanceRegistered(event);
		expect(academicYearPort.findByCourseId).toHaveBeenCalledWith('course-55');
	});

	it('no lanza error si el academic year no existe (silencioso)', async () => {
		academicYearPort.findByCourseId.mockResolvedValue(null);
		const event = makeEvent();
		await expect(listener.attendanceRegistered(event)).resolves.toBeUndefined();
	});

	it('propaga errores del GenerateAlertHandler', async () => {
		generateAlertHandler.execute.mockRejectedValue(new Error('DB error'));
		const event = makeEvent();
		await expect(listener.attendanceRegistered(event)).rejects.toThrow(
			'DB error',
		);
	});
});
