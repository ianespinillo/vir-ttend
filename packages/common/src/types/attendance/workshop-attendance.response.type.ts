import type { AttendanceStatus } from '../../constants/attendance-status.enum.js';
import type { WorkshopAvailability } from '../../constants/workshop-schedule.js';
import type { AttendanceRecordJustification } from './attendance-record.response.type.js';

export interface MyWorkshopCommission {
	commissionId: string;
	code: string;
	number: number;
	courseId: string;
	courseName: string;
	hasWorkshopToday: boolean;
	/**
	 * What the course schedule says about the requested date. Absent in
	 * responses of an older API, which are treated as unknown.
	 */
	workshopAvailability?: WorkshopAvailability;
	/** The commission already has saved workshop records on the requested date. */
	hasSavedRecords?: boolean;
}

export interface WorkshopAttendanceRecord {
	id: string | null;
	studentId: string;
	studentName: string;
	status: AttendanceStatus | null;
	editedBy: string | null;
	editedAt: string | null;
	justification?: AttendanceRecordJustification;
}

export interface WorkshopAttendance {
	commissionId: string;
	commissionCode: string;
	courseId: string;
	courseName: string;
	date: string;
	records: WorkshopAttendanceRecord[];
}
