import { randomUUID } from 'node:crypto';

export class AnnouncementId {
	private readonly value: string;

	constructor(value: string) {
		if (!value) {
			throw new Error('Announcement id is required');
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
