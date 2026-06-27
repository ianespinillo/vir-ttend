export class AttendanceRecordId {
	private readonly id: string;

	constructor(id: string) {
		if (!id) throw new Error('ID is required');
		this.id = id;
	}

	getRaw(): string {
		return this.id;
	}
}
