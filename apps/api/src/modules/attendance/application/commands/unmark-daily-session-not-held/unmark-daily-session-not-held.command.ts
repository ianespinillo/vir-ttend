export class UnmarkDailySessionNotHeldCommand {
	constructor(
		readonly tenantId: string,
		readonly courseId: string,
		readonly date: Date,
	) {}
}
