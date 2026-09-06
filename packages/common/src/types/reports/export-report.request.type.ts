export type ExportFormat = 'xlsx' | 'pdf';

export interface ExportReportRequest {
	courseId: string;
	month: number;
	year: number;
	type?: 'monthly' | 'student';
	studentId?: string;
}

export interface GenerateReportRequest {
	courseId: string;
	month: number;
	year: number;
}
