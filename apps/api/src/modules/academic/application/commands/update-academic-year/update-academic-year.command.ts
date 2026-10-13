interface Thresholds {
	absenceThresholdPercent?: number;
	lateCountAbscenseAfterMinutes?: number;
}

export class UpdateAcademicYearCommand {
	constructor(
		readonly academicYearId: string,
		readonly thresholds: Thresholds,
		readonly nonWorkingDays?: Date[],
		readonly year?: number,
		readonly startDate?: Date,
		readonly endDate?: Date,
		readonly isActive?: boolean,
	) {}
}
