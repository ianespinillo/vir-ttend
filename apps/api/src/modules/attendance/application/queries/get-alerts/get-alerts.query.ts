export class GetAlertsQuery {
	constructor(
		readonly preceptorId: string,
		readonly page: number,
		readonly limit: number,
		readonly courseId?: string,
		readonly alertType?: string,
		readonly role?: string,
		readonly tenantId?: string,
	) {}
}
