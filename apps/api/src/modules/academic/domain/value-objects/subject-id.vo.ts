import { DomainError } from '../../../../common/errors';
export class SubjectId {
	private readonly value: string;

	constructor(id: string) {
		if (!id)
			throw new DomainError('El identificador de la materia es obligatorio.');
		this.value = id;
	}

	getRaw(): string {
		return this.value;
	}
}
