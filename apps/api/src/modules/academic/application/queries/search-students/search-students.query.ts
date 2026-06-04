export class SearchStudentsQuery {
	constructor(
		public readonly query: string,
		public readonly tenantId: string,
		public readonly limit: number = 10,
		public readonly page: number = 1,
	) {}
}
