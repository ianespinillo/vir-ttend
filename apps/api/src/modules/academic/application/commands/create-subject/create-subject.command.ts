export class CreateSubjectCommand {
	constructor(
		readonly courseId: string,
		readonly teacherId: string,
		readonly name: string,
		readonly area: string,
		readonly weeklyHours: number,
	) {}
}
