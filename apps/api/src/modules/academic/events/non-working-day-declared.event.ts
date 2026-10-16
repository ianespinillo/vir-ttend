export class NonWorkingDayDeclaredEvent {
	readonly occurredAt: Date;

	constructor(
		readonly academicYearId: string,
		readonly tenantId: string,
		readonly date: Date,
		readonly reason: string,
		readonly authorId: string,
		readonly type?: string,
	) {
		this.occurredAt = new Date();
	}
}
