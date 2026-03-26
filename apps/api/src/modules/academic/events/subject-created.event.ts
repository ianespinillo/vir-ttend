export class SubjectCreatedEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly subjectId: string,
		readonly courseId: string,
		readonly teacherId: string,
		readonly name: string,
		readonly area: string,
		readonly weeklyHours: number,
	) {
		this.ocurredAt = new Date();
	}
}
