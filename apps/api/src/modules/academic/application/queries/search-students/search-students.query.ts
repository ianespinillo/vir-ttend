export class SearchStudentsQuery {
	constructor(
		public readonly query: string,
		public readonly tenantId: string,
		public readonly page: number = 1,
		public readonly limit: number = 10,
		public readonly preceptorId?: string,
	) {}
}
