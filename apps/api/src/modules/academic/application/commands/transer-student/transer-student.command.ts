export class TransferStudentCommand {
	constructor(
		public readonly studentId: string,
		public readonly newCourseId: string,
		public readonly reason?: string,
	) {}
}
