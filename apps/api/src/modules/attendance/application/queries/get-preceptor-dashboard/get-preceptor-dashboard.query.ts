export class GetPreceptorDashboardQuery {
	constructor(
		readonly preceptorId: string,
		readonly date: Date,
	) {}
}
