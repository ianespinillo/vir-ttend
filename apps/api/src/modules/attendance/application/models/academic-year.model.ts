export interface IAcademicYearModel {
	id: string;
	startDate: Date;
	endDate: Date;
	nonWorkingDays: Date[];
	absenceThresholdPercent: number;
	lateCountAbscenseAfterMinutes: number;
}
