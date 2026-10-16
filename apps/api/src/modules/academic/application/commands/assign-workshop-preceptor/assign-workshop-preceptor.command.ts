export class AssignWorkshopPreceptorCommand {
	constructor(
		readonly commissionId: string,
		readonly tenantId: string,
		readonly preceptorId: string | null,
	) {}
}
