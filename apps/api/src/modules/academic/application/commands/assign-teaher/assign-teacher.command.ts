export class AssignTeacherCommand {
	constructor(
		readonly subjectId: string,
		readonly teacherId: string,
		readonly tenantId: string,
	) {}
}
