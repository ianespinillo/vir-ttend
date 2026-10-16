import { DomainError } from '../../../../common/errors';

/** The email is missing or malformed (HTTP 400 through the global filter). */
export class InvalidMailException extends DomainError {
	constructor(_email: string) {
		super('El correo electrónico no es válido.');
	}
}
