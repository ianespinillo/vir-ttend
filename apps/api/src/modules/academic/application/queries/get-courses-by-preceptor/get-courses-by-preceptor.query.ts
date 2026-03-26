export class GetCoursesByPreceptorQuery {
	constructor(
		readonly academicYearId: string,
		readonly preceptorId: string,
	) {}
}
