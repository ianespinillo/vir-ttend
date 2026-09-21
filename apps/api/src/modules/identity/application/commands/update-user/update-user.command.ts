import { Email } from '../../../domain/value-objects/email.vo';

export class UpdateUserCommand {
	constructor(
		readonly userId: string,
		readonly tenantId: string,
		readonly props: { email?: Email; firstName?: string; lastName?: string },
	) {}
}
