export class GetDailyAttendanceQuery {
	constructor(
		readonly courseId: string,
		readonly date: Date,
	) {}
}
