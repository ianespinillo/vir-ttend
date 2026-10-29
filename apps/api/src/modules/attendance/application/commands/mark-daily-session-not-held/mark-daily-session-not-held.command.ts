export class MarkDailySessionNotHeldCommand {
	constructor(
		readonly tenantId: string,
		readonly courseId: string,
		readonly date: Date,
		readonly reason: string | undefined,
		readonly userId: string,
	) {}
}
