import { DomainError } from '../../../../common/errors';
export class Subdomain {
	private readonly value: string;
	constructor(subdomain: string) {
		if (!subdomain) throw new DomainError('El subdominio es obligatorio.');
		this.value = subdomain;
	}

	update(subdomain: string): Subdomain {
		return new Subdomain(subdomain);
	}
	getRaw(): string {
		return this.value;
	}
}
