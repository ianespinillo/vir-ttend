import { SHIFT } from '@repo/common';

export class DeclareNonWorkingDayCommand {
	constructor(
		readonly academicYearId: string,
		readonly date: Date,
		readonly reason: string,
		readonly type: string | undefined,
		readonly notifySchool: boolean,
		readonly tenantId: string,
		readonly authorId: string,
		/** Shifts the suspension applies to; empty or missing = every shift. */
		readonly shifts: SHIFT[] = [],
	) {}
}
