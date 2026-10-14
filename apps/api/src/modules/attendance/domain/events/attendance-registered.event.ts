import { AttendanceRecord } from '../entities/attendance-record.entity';
import { WorkshopAttendanceRecord } from '../entities/workshop-attendance-record.entity';

export class AttendanceRegisteredEvent {
	constructor(
		readonly occurredAt: Date,
		readonly attendance: AttendanceRecord | WorkshopAttendanceRecord,
	) {}
}
