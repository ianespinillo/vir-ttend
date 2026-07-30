export class GetMonthlyReportQuery {
	constructor(
		readonly courseId: string,
		readonly month: number,
		readonly year: number,
	) {}
}
