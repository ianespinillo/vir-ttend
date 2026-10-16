import { randomUUID } from 'node:crypto';
import { DomainError } from '../../../../common/errors';

export class AnnouncementId {
	private readonly value: string;

	constructor(value: string) {
		if (!value) {
			throw new DomainError('El identificador del comunicado es obligatorio.');
		}
		this.value = value;
	}

	static generate(): AnnouncementId {
		return new AnnouncementId(randomUUID());
	}

	getRaw(): string {
		return this.value;
	}

	equals(other: AnnouncementId): boolean {
		return other instanceof AnnouncementId && this.value === other.value;
	}
}
