export class UserLoggedInEvent {
	readonly ocurredAt: Date;
	constructor(
		private readonly userId: string,
		private readonly tenantId: string,
		private readonly ipAddress: string,
		private readonly userAgent: string,
	) {
		this.ocurredAt = new Date();
	}
}
