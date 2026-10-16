/**
 * Base error for the domain and application layers. It carries a message
 * meant for the end user and does not depend on HTTP; the global exception
 * filter maps each subclass to its status code. A plain `DomainError` means
 * the input is invalid (HTTP 400).
 */
export class DomainError extends Error {
	constructor(message: string) {
		super(message);
		this.name = new.target.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/** The requested resource does not exist (HTTP 404). */
export class NotFoundError extends DomainError {}

/** The operation clashes with the current state, e.g. a duplicate (HTTP 409). */
export class ConflictError extends DomainError {}

/** The user is authenticated but may not perform the operation (HTTP 403). */
export class ForbiddenError extends DomainError {}

/** The user could not be authenticated (HTTP 401). */
export class UnauthorizedError extends DomainError {}

/** The input is well formed but breaks a business rule (HTTP 422). */
export class BusinessRuleError extends DomainError {}
