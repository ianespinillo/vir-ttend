export class GetStudentReportQuery {
	constructor(
		readonly studentId: string,
		readonly academicYearId: string,
	) {}
}
