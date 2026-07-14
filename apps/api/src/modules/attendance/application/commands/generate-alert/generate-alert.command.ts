export class GenerateAlertCommand {
	constructor(
		readonly studentId: string,
		readonly courseId: string,
		readonly academicYearId: string,
		readonly tenantId: string,
	) {}
}
