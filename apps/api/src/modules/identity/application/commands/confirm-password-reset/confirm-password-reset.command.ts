import { Password } from '../../../domain/value-objects/password.vo';

export class ConfirmPasswordResetCommand {
	constructor(
		readonly email: string,
		readonly code: string,
		readonly newPassword: Password,
	) {}
}
