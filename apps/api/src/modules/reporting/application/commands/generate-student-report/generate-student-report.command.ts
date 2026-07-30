export class GenerateStudentReportCommand {
	constructor(
		readonly studentId: string,
		readonly academicYearId: string,
	) {}
}
