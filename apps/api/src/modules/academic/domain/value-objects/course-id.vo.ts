import { DomainError } from '../../../../common/errors';
export class CourseId {
	private readonly value: string;

	constructor(id: string) {
		if (!id) throw new DomainError('El identificador del curso es obligatorio.');
		this.value = id;
	}

	getRaw(): string {
		return this.value;
	}
}
