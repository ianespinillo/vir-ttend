import { Password } from '../../../domain/value-objects/password.vo';
export class ChangePasswordCommand {
	constructor(
		readonly userId: string,
		readonly oldPassword: Password,
		readonly newPassword: Password,
	) {}
}
