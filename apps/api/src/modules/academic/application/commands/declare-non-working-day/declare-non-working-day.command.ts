export class DeclareNonWorkingDayCommand {
	constructor(
		readonly academicYearId: string,
		readonly date: Date,
		readonly reason: string,
		readonly type: string | undefined,
		readonly notifySchool: boolean,
		readonly tenantId: string,
		readonly authorId: string,
	) {}
}
