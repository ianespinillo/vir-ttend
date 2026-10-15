import { DomainError } from '../../../../common/errors';
export class PasswordHashed {
	private readonly value: string;
	constructor(value: string) {
		if (!value) {
			throw new DomainError('La contraseña es obligatoria.');
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
