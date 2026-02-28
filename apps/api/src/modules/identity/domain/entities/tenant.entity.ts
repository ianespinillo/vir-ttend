import { randomUUID } from 'node:crypto';
import { Email } from '../value-objects/email.vo';
import { Subdomain } from '../value-objects/subdomain.vo';

interface CreateProps {
	name: string;
	subdomain: string;
	contactEmail: string;
}

interface ConstructorProps {
	id: string;
	name: string;
	isActive: boolean;
	contactEmail: Email;
	subdomain: Subdomain;
	createdAt: Date;
	updatedAt: Date;
}

interface ReconstituteProps {
	id: string;
	name: string;
	isActive: boolean;
	contactEmail: string;
	subdomain: string;
	createdAt: Date;
	updatedAt: Date;
}

export class Tenant {
	private readonly _id: string;
	private _name: string;
	private readonly _subomain: Subdomain;
	private _contactEmail: Email;
	private _isActive: boolean;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor({
		id,
		name,
		subdomain,
		contactEmail,
		isActive,
		createdAt,
		updatedAt,
	}: Readonly<ConstructorProps>) {
		this._id = id;
		this._name = name;
		this._subomain = subdomain;
		this._contactEmail = contactEmail;
		this._isActive = isActive;
		this._createdAt = createdAt;
		this._updatedAt = updatedAt;
	}
	static create(props: CreateProps): Tenant {
		return new Tenant({
			id: randomUUID(),
			name: props.name,
			subdomain: new Subdomain(props.subdomain),
			contactEmail: new Email(props.contactEmail),
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
	static reconstitute(props: ReconstituteProps): Tenant {
		return new Tenant({
			...props,
			subdomain: new Subdomain(props.subdomain),
			contactEmail: new Email(props.contactEmail),
		});
	}
	get id() {
		return this._id;
	}
	get name() {
		return this._name;
	}
	get subdomain() {
		return this._subomain;
	}
	get contatEmail() {
		return this._contactEmail;
	}
	get isActive() {
		return this._isActive;
	}
	get createdAt() {
		return this._createdAt;
	}
	get updatedAt() {
		return this._updatedAt;
	}
	activate(): void {
		this._isActive = true;
		this._updatedAt = new Date();
	}
	deactivate(): void {
		this._isActive = false;
		this._updatedAt = new Date();
	}
	updateContactEmail(newEmail: string) {
		this._contactEmail = this._contactEmail.update(newEmail);
		this._updatedAt = new Date();
	}
	updateName(name: string) {
		this._name = name;
		this._updatedAt = new Date();
	}
}
