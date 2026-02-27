export class GetUserWithMembershipQuery {
	constructor(
		readonly userId: string,
		readonly tenantId: string,
	) {}
}
