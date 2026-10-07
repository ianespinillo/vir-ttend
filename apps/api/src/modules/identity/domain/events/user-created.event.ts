export class UserCreatedEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly userId: string,
		readonly email: string,
		readonly tenantId: string,
		readonly rawPassword: string,
		readonly firstName: string,
		readonly lastName: string,
	) {
		this.ocurredAt = new Date();
	}
}
