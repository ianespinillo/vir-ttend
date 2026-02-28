export class Subdomain {
	private readonly value: string;
	constructor(subdomain: string) {
		if (!subdomain) throw new Error("Subdomain can't be empty");
		this.value = subdomain;
	}

	update(subdomain: string): Subdomain {
		return new Subdomain(subdomain);
	}
	getRaw(): string {
		return this.value;
	}
}
