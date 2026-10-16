import { DomainError } from '../../../../common/errors';
export class StudentId {
	private readonly value: string;
	constructor(value: string) {
		if (!value || value.trim() === '') {
			throw new DomainError('El identificador del estudiante es obligatorio.');
		}
		this.value = value;
	}

	getValue(): string {
		return this.value;
	}
}
