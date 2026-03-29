export class AcademicYearCreatedEvent {
	readonly occurredAt: Date;

	constructor(
		readonly academicYearId: string,
		readonly tenantId: string,
		readonly year: number,
		readonly startDate: Date,
		readonly endDate: Date,
	) {
		this.occurredAt = new Date();
	}
}
