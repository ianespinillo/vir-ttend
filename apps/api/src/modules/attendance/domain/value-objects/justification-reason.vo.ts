export class JustificationReason {
	private readonly value: string;

	constructor(value: string) {
		if (!value) {
			throw new Error("Invalid justification reason, it can't be empty.");
		}
		if (value.length > 500) {
			throw new Error(
				'Invalid justification reason, it should be at least 500 characters.',
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
