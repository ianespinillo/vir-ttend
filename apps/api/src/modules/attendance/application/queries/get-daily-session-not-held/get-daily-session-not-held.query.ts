export class GetDailySessionNotHeldQuery {
	constructor(
		readonly courseId: string,
		readonly date: Date,
	) {}
}
