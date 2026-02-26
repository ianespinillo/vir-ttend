export class GetCurrentUserQuery {
	constructor(
		readonly userId: string,
		readonly tenantId: string,
	) {}
}
