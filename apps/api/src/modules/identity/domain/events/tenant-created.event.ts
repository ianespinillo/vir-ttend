export class TenantCreatedEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly name: string,
		readonly subdomain: string,
	) {
		this.ocurredAt = new Date();
	}
}
