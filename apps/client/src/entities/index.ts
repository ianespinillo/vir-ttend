export interface User {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'preceptor' | 'teacher' | 'director';
	status: 'active' | 'inactive';
}

export interface Tenant {
	id: string;
	name: string;
	subdomain: string;
	contactEmail: string;
	status: 'active' | 'inactive';
}

export interface AcademicYear {
	id: string;
	year: number;
	startDate: string;
	endDate: string;
	absenceThresholdPercent: number;
}

export interface Course {
	id: string;
	level: 'primary' | 'secondary';
	yearNumber: number;
	division: string;
	shift: 'morning' | 'afternoon' | 'night';
	preceptorId?: string;
}

export interface Subject {
	id: string;
	courseId: string;
	teacherId: string;
	name: string;
	area: string;
	weeklyHours: number;
}

export interface Student {
	id: string;
	courseId: string;
	firstName: string;
	lastName: string;
	documentNumber: string;
	birthDate: string;
	tutorName: string;
	tutorPhone: string;
	status: 'active' | 'inactive';
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified';

export interface AttendanceRecord {
	id: string;
	studentId: string;
	courseId: string;
	subjectId?: string;
	date: string;
	status: AttendanceStatus;
	editedBy?: string;
	editedAt?: string;
}

export interface Justification {
	id: string;
	attendanceRecordId: string;
	reason: string;
	notes?: string;
	createdBy: string;
}

export interface DailyAttendanceMetric {
	totalStudents: number;
	presentCount: number;
	absentCount: number;
	lateCount: number;
	justifiedCount: number;
	attendancePercentage: number;
}
