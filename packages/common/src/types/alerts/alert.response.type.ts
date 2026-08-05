export type AlertType = 'warning' | 'critical' | 'exceeded';

export interface Alert {
	id: string;
	studentId: string;
	studentName: string;
	courseId: string;
	courseName: string;
	alertType: AlertType;
	absencePercent: number;
	seenAt: Date | null;
	createdAt: Date;
}
