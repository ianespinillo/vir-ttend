export class UserPasswordResetEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly userId: string,
		readonly email: string,
		readonly firstName: string,
		readonly lastName: string,
		readonly rawPassword: string,
	) {
		this.ocurredAt = new Date();
	}
}
