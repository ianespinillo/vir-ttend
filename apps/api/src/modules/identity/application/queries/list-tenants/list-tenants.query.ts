export class ListTenantsQuery {
	constructor(
		readonly page: number,
		readonly limit: number,
	) {}
}
