import { DomainError } from '../../../../common/errors';

export class JustificationReason {
	private readonly value: string;

	constructor(value: string) {
		if (!value) {
			throw new DomainError('El motivo de la justificación es obligatorio');
		}
		if (value.length > 500) {
			throw new DomainError(
				'El motivo de la justificación no puede superar los 500 caracteres',
			);
		}
		this.value = value;
	}

	getRaw(): string {
		return this.value;
	}

	modify(value: string): JustificationReason {
		return new JustificationReason(value);
	}
}
