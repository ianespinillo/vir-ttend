export class SetCourseStatusCommand {
	constructor(
		readonly courseId: string,
		readonly tenantId: string,
		readonly isActive: boolean,
	) {}
}
