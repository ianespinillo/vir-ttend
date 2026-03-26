export class AcademicYearId {
	private readonly value: string;

	constructor(id: string) {
		if (!id) throw new Error('Id can not be empty');
		this.value = id;
	}

	getRaw(): string {
		return this.value;
	}
}
