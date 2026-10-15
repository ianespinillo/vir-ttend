import { DomainError } from '../../../../common/errors';
export class AcademicYearId {
	private readonly value: string;

	constructor(id: string) {
		if (!id)
			throw new DomainError('El identificador del ciclo lectivo es obligatorio.');
		this.value = id;
	}

	getRaw(): string {
		return this.value;
	}
}
