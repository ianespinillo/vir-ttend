import type { AttendanceRecord } from './attendance-record.response.type.js';

export interface SubjectAttendanceMetrics {
	totalStudents: number;
	present: number;
	absent: number;
	late: number;
	justified: number;
}

export interface SubjectAttendanceResponse {
	subjectId: string;
	subjectName: string;
	courseId: string;
	date: string;
	records: AttendanceRecord[];
	metrics: SubjectAttendanceMetrics;
}
