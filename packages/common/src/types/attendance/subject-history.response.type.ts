import type { AttendanceStatus } from '../../constants/attendance-status.enum.js';

export interface ClassSession {
	date: string;
	present: number;
	absent: number;
	late: number;
	justified: number;
	totalStudents: number;
}

export interface StudentSubjectRecord {
	studentId: string;
	studentName: string;
	records: Array<{
		date: string;
		status: AttendanceStatus;
	}>;
	absencePercent: number;
}

export interface SubjectHistoryResponse {
	subjectId: string;
	subjectName: string;
	from: string;
	to: string;
	classDates: string[];
	sessions: ClassSession[];
	studentRecords: StudentSubjectRecord[];
}
