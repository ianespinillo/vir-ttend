export interface StudentAtRisk {
	studentId: string;
	studentName: string;
	absencePercent: number;
}

export interface AttendanceMetrics {
	totalStudents: number;
	present: number;
	absent: number;
	late: number;
	justified: number;
	absentPercent: number;
	studentsAtRisk: StudentAtRisk[];
}
