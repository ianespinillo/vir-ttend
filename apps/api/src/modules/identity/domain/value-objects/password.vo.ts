const VALID_CHARACTERS =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
export class Password {
	private readonly value: string;
	private readonly passwordRegex =
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
	constructor(value: string) {
		if (!value || value.length < 8 || !this.isValidPassword(value)) {
			throw new Error('Password must be at least 8 characters long');
		}
		this.value = value;
	}
	static generateRandomPassword(length = 12): Password {
		const lower = 'abcdefghijklmnopqrstuvwxyz';
		const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const numbers = '0123456789';
		const special = '@$!%*?&';

		// garantiza al menos uno de cada tipo
		const required = [
			lower[Math.floor(Math.random() * lower.length)],
			upper[Math.floor(Math.random() * upper.length)],
			numbers[Math.floor(Math.random() * numbers.length)],
			special[Math.floor(Math.random() * special.length)],
		];

		// rellena el resto con caracteres aleatorios del total
		const rest = Array.from(
			{ length: length - 4 },
			() => VALID_CHARACTERS[Math.floor(Math.random() * VALID_CHARACTERS.length)],
		);

		// mezcla para que los requeridos no queden siempre al principio
		return new Password(
			[...required, ...rest].sort(() => Math.random() - 0.5).join(''),
		);
	}
	private isValidPassword(password: string): boolean {
		return this.passwordRegex.test(password);
	}

	getRaw(): string {
		return this.value;
	}

	public equals(other: Password): boolean {
		if (!(other instanceof Password)) {
			return false;
		}
		return this.value === other.value;
	}
}
