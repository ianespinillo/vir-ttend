export class CreateAcademicYearCommand {
	constructor(
		readonly schoolId: string,
		readonly year: number,
		readonly startDate: Date,
		readonly endDate: Date,
		readonly nonWorkingDays?: Date[],
		// Nombres idénticos a AcademicYear.CreateProps: el handler hace
		// `{...command}` y un desfasamiento de nombre descarta el valor en silencio.
		readonly absenceThresholdPercent: number = 75,
		readonly lateCountAbscenseAfterMinutes: number = 15,
		readonly isActive: boolean = true,
	) {}
}
