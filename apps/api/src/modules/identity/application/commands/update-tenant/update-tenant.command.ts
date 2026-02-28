export class UpdateTenantCommand {
	constructor(
		readonly tenantId: string,
		readonly name?: string,
		readonly contactEmail?: string,
	) {}
}
