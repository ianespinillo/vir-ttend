export class UpdateSubjectCommand {
	constructor(
		readonly subjectId: string,
		readonly teacherId?: string,
		readonly area?: string,
		readonly name?: string,
		readonly weeklyHours?: number,
	) {}
}
