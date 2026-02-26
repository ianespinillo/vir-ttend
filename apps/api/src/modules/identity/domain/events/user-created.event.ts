export class UserCreatedEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly userId: string,
		readonly email: string,
		readonly tenantId: string,
		readonly rawPassword: string,
	) {
		this.ocurredAt = new Date();
	}
}
