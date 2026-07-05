export class CopyAttendanceCommand {
	constructor(
		readonly userId: string,
		readonly subjectId: string,
		readonly targetDate: Date,
		readonly sourceDate?: Date,
	) {}
}
