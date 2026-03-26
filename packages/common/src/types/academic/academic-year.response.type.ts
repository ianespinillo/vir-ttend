export interface IAcademicYearResponse {
	id: string;
	year: number;
	startDate: Date;
	endDate: Date;
	absenceThresholdPercent: number;
	lateCountAbscenseAfterMinutes: number;
	isActive: boolean;
}
