export class GetStudentAlertsQuery {
	constructor(
		readonly studentId: string,
		readonly academicYearId: string,
	) {}
}
