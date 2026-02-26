import { InvalidMailException } from '../exceptions/invalid-mail.exception';

export class Email {
	private readonly value: string;

	constructor(value: string) {
		if (!value) {
			throw new InvalidMailException('null');
		}
		const trimed = value.trim().toLowerCase();
		if (!this.validateEmail(trimed)) {
			throw new InvalidMailException(value);
		}
		this.value = value;
	}

	private validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	update(newEmail: string): Email {
		return new Email(newEmail);
	}

	getValue(): string {
		return this.value;
	}

	public equals(other: Email): boolean {
		if (!(other instanceof Email)) {
			return false;
		}
		return this.value === other.value;
	}
}
