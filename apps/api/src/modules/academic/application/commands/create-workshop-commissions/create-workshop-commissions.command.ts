export class CreateWorkshopCommissionsCommand {
	constructor(
		readonly courseId: string,
		readonly tenantId: string,
	) {}
}
