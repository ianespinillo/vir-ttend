export class GetAttendanceMetricsQuery {
	constructor(
		readonly courseId: string,
		readonly date: Date,
	) {}
}
