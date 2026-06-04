import { Email } from '../../../identity/domain/value-objects/email.vo';
export class Tutor {
	private readonly _firstName: string;
	private readonly _lastName: string;
	private readonly _phone: string;
	private readonly _email?: Email;

	constructor(
		firstName: string,
		lastName: string,
		phone: string,
		email?: Email,
	) {
		this._firstName = firstName;
		this._lastName = lastName;
		this._phone = phone;
		this._email = email;
	}

	get firstName() {
		return this._firstName;
	}

	get lastName() {
		return this._lastName;
	}

	get phone() {
		return this._phone;
	}

	get email() {
		return this._email;
	}
}
