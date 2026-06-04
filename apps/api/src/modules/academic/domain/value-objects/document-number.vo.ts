export class DocumentNumber {
	private readonly value: string;
	constructor(value: string) {
		if (!value || value.trim() === '') {
			throw new Error('Document number cannot be empty.');
		}
		//dni should be 8 digits ignoring "." and "-" characters
		const cleanedValue = value.replace(/[\.\-]/g, '');
		if (!/^\d{8}$/.test(cleanedValue)) {
			throw new Error('Document number must be 8 digits long.');
		}
		const numeric = Number.parseInt(cleanedValue, 10);
		if (numeric < 1000000) {
			throw new Error('Document number is not valid.');
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
