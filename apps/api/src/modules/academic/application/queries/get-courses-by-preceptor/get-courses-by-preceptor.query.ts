export class GetCoursesByPreceptorQuery {
	constructor(
		readonly preceptorId: string,
		readonly academicYearId: string,
	) {}
}
