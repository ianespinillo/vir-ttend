export class GetTeacherSubjectsQuery {
	constructor(
		readonly teacherId: string,
		readonly academicYearId: string,
	) {}
}
