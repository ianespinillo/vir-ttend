export class GetCourseSummaryQuery {
	constructor(
		readonly courseId: string,
		readonly academicYearId: string,
	) {}
}
