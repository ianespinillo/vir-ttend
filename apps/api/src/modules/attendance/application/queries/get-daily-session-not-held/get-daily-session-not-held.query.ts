export class GetDailySessionNotHeldQuery {
	constructor(
		readonly tenantId: string,
		readonly courseId: string,
		readonly date: Date,
	) {}
}
