export class MoveStudentToCommissionCommand {
	constructor(
		readonly commissionId: string,
		readonly studentId: string,
		readonly tenantId: string,
		readonly actorId?: string,
		readonly actorRole?: string,
	) {}
}
