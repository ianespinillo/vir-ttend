export class MarkAlertSeenCommand {
	constructor(
		readonly alertId: string,
		readonly seenBy: string,
	) {}
}
