export class PasswordResetRequestedEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly userId: string,
		readonly email: string,
		readonly firstName: string,
		readonly lastName: string,
		readonly code: string,
		readonly expiresInMinutes: number,
	) {
		this.ocurredAt = new Date();
	}
}
