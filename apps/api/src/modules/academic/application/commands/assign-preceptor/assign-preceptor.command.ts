export class AssignPreceptorCommand {
	constructor(
		readonly preceptorId: string,
		readonly courseId: string,
	) {}
}
