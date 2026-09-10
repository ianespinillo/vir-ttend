export class GetUnseenAlertsQuery {
	constructor(
		readonly preceptorId: string,
		readonly role?: string,
		readonly tenantId?: string,
	) {}
}
