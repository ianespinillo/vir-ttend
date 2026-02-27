export class ToggleTenantStatusCommand {
	constructor(
		readonly tenantId: string,
		readonly isActive: boolean,
	) {}
}
