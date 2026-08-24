export class CopyDailyAttendanceCommand {
	constructor(
		readonly userId: string,
		readonly courseId: string,
		readonly targetDate: Date,
		readonly sourceDate?: Date,
	) {}
}
