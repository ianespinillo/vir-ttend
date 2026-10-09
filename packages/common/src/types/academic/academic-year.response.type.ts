export interface IAcademicYearResponse {
	id: string;
	year: number;
	startDate: Date;
	endDate: Date;
	nonWorkingDays: Date[];
	absenceThresholdPercent: number;
	lateCountAbscenseAfterMinutes: number;
	isActive: boolean;
}
