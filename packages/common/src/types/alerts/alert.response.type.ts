export type AlertType = 'warning' | 'critical' | 'exceeded';

export interface Alert {
	id: string;
	studentId: string;
	studentName: string;
	courseId: string;
	courseName: string;
	alertType: AlertType;
	/** Weighted absences (0.25 steps) when the alert was raised. */
	absenceCount: number;
	/** Threshold the alert was raised for: 10, 20 or the student's cap. */
	threshold: number;
	seenAt: Date | null;
	createdAt: Date;
}
