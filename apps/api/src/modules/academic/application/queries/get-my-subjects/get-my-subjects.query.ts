export class GetMySubjectsQuery {
	constructor(
		readonly teacherId: string,
		readonly tenantId: string,
	) {}
}
