import type { AttendanceStatus } from '../../constants/attendance-status.enum.js';

export interface MyWorkshopCommission {
	commissionId: string;
	code: string;
	number: number;
	courseId: string;
	courseName: string;
	hasWorkshopToday: boolean;
}

export interface WorkshopAttendanceRecord {
	id: string | null;
	studentId: string;
	studentName: string;
	status: AttendanceStatus | null;
	editedBy: string | null;
	editedAt: string | null;
}

export interface WorkshopAttendance {
	commissionId: string;
	commissionCode: string;
	courseId: string;
	courseName: string;
	date: string;
	records: WorkshopAttendanceRecord[];
}
