import { AttendanceRecord } from '../entities/attendance-record.entity';

export class AttendanceRegisteredEvent {
	constructor(
		readonly occurredAt: Date,
		readonly attendance: AttendanceRecord,
	) {}
}
