export class GenerateMonthlyReportCommand {
	constructor(
		readonly courseId: string,
		readonly year: number,
		readonly month: number,
	) {}
}
