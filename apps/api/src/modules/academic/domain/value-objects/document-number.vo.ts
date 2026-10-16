import { DomainError } from '../../../../common/errors';
export class DocumentNumber {
	private readonly value: string;
	constructor(value: string) {
		if (!value || value.trim() === '') {
			throw new DomainError('El número de documento es obligatorio.');
		}
		//dni should be 8 digits ignoring "." and "-" characters
		const cleanedValue = value.replace(/[\.\-]/g, '');
		if (!/^\d{8}$/.test(cleanedValue)) {
			throw new DomainError('El número de documento debe tener 8 dígitos.');
		}
		const numeric = Number.parseInt(cleanedValue, 10);
		if (numeric < 1000000) {
			throw new DomainError('El número de documento no es válido.');
		}
		this.value = cleanedValue;
	}

	getValue(): string {
		return this.value;
	}
	getNumericValue(): number {
		return Number.parseInt(this.value, 10);
	}
}
