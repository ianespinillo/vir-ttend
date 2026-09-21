import type { Roles } from '@repo/common';

export class ResetUserPasswordCommand {
	constructor(
		public readonly userId: string,
		public readonly actorRole: Roles,
		public readonly tenantId?: string,
	) {}
}
