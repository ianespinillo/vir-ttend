export class PasswordHashed {
	private readonly value: string;
	constructor(value: string) {
		if (!value) {
			throw new Error('Hashed password cannot be empty');
		}
		this.value = value;
	}

	static fromHash(hash: string): PasswordHashed {
		return new PasswordHashed(hash);
	}

	getRaw(): string {
		return this.value;
	}
}
