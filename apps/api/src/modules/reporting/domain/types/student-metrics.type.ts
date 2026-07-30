export interface IStudentMetrics {
	present: number;
	absent: number;
	late: number;
	justified: number;
	absencePercent: number;
	status: 'ok' | 'at-risk' | 'exceeded';
}
