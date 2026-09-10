export class GetAlertsCountQuery {
	constructor(
		readonly preceptorId: string,
		readonly role?: string,
		readonly tenantId?: string,
	) {}
}
