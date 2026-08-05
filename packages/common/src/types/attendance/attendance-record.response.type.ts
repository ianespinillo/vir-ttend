import type { AttendanceStatus } from '../../constants/attendance-status.enum.js';

export interface AttendanceRecordJustification {
	id: string;
	reason: string;
	notes?: string;
	createdBy: string;
	createdAt: Date;
}

export interface AttendanceRecord {
	id: string;
	studentId: string;
	studentName: string;
	status: AttendanceStatus;
	subjectId?: string;
	justification?: AttendanceRecordJustification;
}
