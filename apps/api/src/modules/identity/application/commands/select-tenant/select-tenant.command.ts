export class SelectTenantCommand {
	constructor(
		readonly userId: string,
		readonly tenantId: string,
		public readonly userAgent: string,
		public readonly ipAddress: string,
		public readonly isSuperAdminOrImpersonating?: boolean,
	) {}
}
