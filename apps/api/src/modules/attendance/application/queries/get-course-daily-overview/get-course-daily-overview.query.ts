export class GetCourseDailyOverviewQuery {
	constructor(
		readonly courseId: string,
		readonly date: Date,
	) {}
}
