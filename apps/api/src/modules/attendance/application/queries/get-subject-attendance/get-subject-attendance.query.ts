export class GetSubjectAttendanceQuery {
	constructor(
		readonly subjectId: string,
		readonly date: Date,
	) {}
}
