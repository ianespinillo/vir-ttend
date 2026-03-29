interface Thresholds {
	absenceThresholdPercent?: number;
	lateCountAbscenseAfterMinutes?: number;
}

export class UpdateAcademicYearCommand {
	constructor(
		readonly academicYearId: string,
		readonly thresholds: Thresholds,
		readonly nonWorkingDays?: Date[],
	) {}
}
