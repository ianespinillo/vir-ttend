export class RegenerateWorkshopCommissionsCommand {
	constructor(
		readonly courseId: string,
		readonly tenantId: string,
		readonly confirm: boolean,
	) {}
}
