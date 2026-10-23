import { SHIFT } from '@repo/common';

export class NonWorkingDayDeclaredEvent {
	readonly occurredAt: Date;

	constructor(
		readonly academicYearId: string,
		readonly tenantId: string,
		readonly date: Date,
		readonly reason: string,
		readonly authorId: string,
		readonly type?: string,
		/** Affected shifts; empty = every shift. */
		readonly shifts: SHIFT[] = [],
	) {
		this.occurredAt = new Date();
	}
}
