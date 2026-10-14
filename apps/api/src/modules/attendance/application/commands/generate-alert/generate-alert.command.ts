export class GenerateAlertCommand {
	constructor(
		readonly studentId: string,
		readonly courseId: string,
		readonly academicYearId: string,
		readonly tenantId: string,
		/** `YYYY-MM-DD` date of the attendance record that triggered the evaluation. */
		readonly triggerDate?: string,
	) {}
}
