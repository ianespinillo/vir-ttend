export class GetPreceptorDashboardQuery {
	constructor(
		readonly tenantId: string,
		readonly preceptorId: string,
		readonly date: Date,
	) {}
}
