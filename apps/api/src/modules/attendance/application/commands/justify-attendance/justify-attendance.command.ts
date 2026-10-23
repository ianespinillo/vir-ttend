export class JustifyAttendanceCommand {
	constructor(
		readonly attendanceRecordId: string,
		readonly reason: string,
		readonly justifiedBy: string,
		readonly tenantId: string,
		readonly notes?: string,
	) {}
}
