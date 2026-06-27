export class GetAttendanceHistoryQuery {
	constructor(
		readonly courseId: string,
		readonly from: Date,
		readonly to: Date,
	) {}
}
