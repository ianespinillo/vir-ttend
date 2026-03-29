export class CreateAcademicYearCommand {
	constructor(
		readonly schoolId: string,
		readonly year: number,
		readonly startDate: Date,
		readonly endDate: Date,
		readonly nonWorkingDays: Date[],
		readonly abscenseThresholdPercent: number,
		readonly lateCountAsAbscenseAfterMinutes: number,
	) {}
}
