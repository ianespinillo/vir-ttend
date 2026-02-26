export class InvalidMailException extends Error {
	constructor(email: string) {
		super(`The email "${email}" is invalid.`);
		this.name = 'InvalidMailException';
		Object.setPrototypeOf(this, InvalidMailException.prototype);
	}
}
