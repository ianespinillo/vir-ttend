export class MoveStudentToCommissionCommand {
	constructor(
		readonly commissionId: string,
		readonly studentId: string,
		readonly tenantId: string,
	) {}
}
