export class StudentId {
	private readonly value: string;
	constructor(value: string) {
		if (!value || value.trim() === '') {
			throw new Error('Student ID cannot be empty.');
		}
		this.value = value;
	}

	getValue(): string {
		return this.value;
	}
}
