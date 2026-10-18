import { DomainError } from '../../../../common/errors';

export class AttendanceRecordId {
	private readonly id: string;

	constructor(id: string) {
		if (!id)
			throw new DomainError(
				'El identificador del registro de asistencia es obligatorio',
			);
		this.id = id;
	}

	getRaw(): string {
		return this.id;
	}
}
