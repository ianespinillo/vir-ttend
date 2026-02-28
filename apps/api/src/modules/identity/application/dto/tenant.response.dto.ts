export class TenantResponseDto {
	constructor(
		readonly id: string,
		readonly name: string,
		readonly subdomain: string,
		readonly contactEmail: string,
		readonly isActive: boolean,
		readonly createdAt: Date,
	) {}
}
