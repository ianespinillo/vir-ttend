import type { Roles } from '@repo/common';

export class GetMyTenantsQuery {
	constructor(
		readonly userId: string,
		readonly role?: Roles,
	) {}
}
