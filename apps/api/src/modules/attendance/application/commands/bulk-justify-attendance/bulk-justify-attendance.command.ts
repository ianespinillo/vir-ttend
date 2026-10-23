export class BulkJustifyAttendanceCommand {
	constructor(
		readonly tenantId: string,
		readonly recordIds: string[],
		readonly reason: string,
		readonly justifiedBy: string,
		readonly notes?: string,
	) {}
}
