import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceAlert } from '../../../src/modules/attendance/domain/entities/attendance-alert.entity';
import { AlertType } from '../../../src/modules/attendance/domain/value-objects/alert-type.vo';
import { AlertTriggeredListener } from '../../../src/modules/attendance/infrastructure/events/alert-triggered.listener';

describe('AlertTriggeredListener', () => {
	const alert = AttendanceAlert.create({
		studentId: 'student-1',
		courseId: 'course-1',
		tenantId: 'tenant-1',
		academicYearId: 'year-1',
		alertType: AlertType.critical(),
		absenceCount: 20.5,
		threshold: 20,
	});

	it('listens on the event name the generate-alert handler emits', () => {
		const metadata = Reflect.getMetadata(
			'EVENT_LISTENER_METADATA',
			AlertTriggeredListener.prototype.execute,
		);
		expect(metadata).toEqual([
			expect.objectContaining({ event: 'alert.triggered' }),
		]);
	});

	it('receives the alert entity emitted on alert.triggered', () => {
		const listener = new AlertTriggeredListener();
		const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
		const emitter = new EventEmitter2();
		emitter.on('alert.triggered', (event) => listener.execute(event));

		emitter.emit('alert.triggered', alert);

		expect(log).toHaveBeenCalledWith(expect.stringContaining('student-1'));
		expect(log).toHaveBeenCalledWith(expect.stringContaining('critical'));
		log.mockRestore();
	});
});
