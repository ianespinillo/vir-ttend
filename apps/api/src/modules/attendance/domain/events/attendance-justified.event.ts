import { AttendanceRecord } from '../entities/attendance-record.entity';
import { Justification } from '../entities/justification.entity';

export class AttendanceJustifiedEvent {
	constructor(
		readonly occurredAt: Date,
		readonly justification: Justification,
		readonly attendance: AttendanceRecord,
	) {}
}
