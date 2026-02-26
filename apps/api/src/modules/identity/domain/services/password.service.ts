import { compare as compareHash, hash } from 'bcryptjs';
import { PasswordHashed } from '../value-objects/password-hashed.vo';
import { Password } from '../value-objects/password.vo';

export class PasswordService {
	async hashPassword(password: Password): Promise<PasswordHashed> {
		const hashed = await hash(password.getRaw(), 10);
		return PasswordHashed.fromHash(hashed);
	}
	async compare(
		password: Password,
		hashedPassword: PasswordHashed,
	): Promise<boolean> {
		return compareHash(password.getRaw(), hashedPassword.getRaw());
	}
}
