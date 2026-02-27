export class CreateTenantCommand {
	constructor(
		readonly name: string,
		readonly subdomain: string,
		readonly contactEmail: string,
	) {}
}
