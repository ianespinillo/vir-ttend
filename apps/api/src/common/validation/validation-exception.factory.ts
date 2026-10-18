import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

type MessageBuilder = (field: string, defaultMessage: string) => string;

/** Text after the last ": " of a class-validator default message (allowed values). */
function allowedValues(defaultMessage: string): string {
	const index = defaultMessage.lastIndexOf(': ');
	return index === -1 ? '' : defaultMessage.slice(index + 2);
}

/** Last number in a class-validator default message (length or bound). */
function boundary(defaultMessage: string): string {
	const numbers = defaultMessage.match(/-?\d+(\.\d+)?/g);
	return numbers ? numbers[numbers.length - 1] : '';
}

/**
 * Spanish message for each class-validator constraint used by the API DTOs.
 * Bounds and allowed values are read back from the default English message,
 * because `ValidationError` does not expose the decorator arguments.
 */
const SPANISH_MESSAGES: Record<string, MessageBuilder> = {
	isNotEmpty: (field) => `El campo ${field} es obligatorio.`,
	isDefined: (field) => `El campo ${field} es obligatorio.`,
	isString: (field) => `El campo ${field} debe ser un texto.`,
	isNumber: (field) => `El campo ${field} debe ser un número.`,
	isInt: (field) => `El campo ${field} debe ser un número entero.`,
	isBoolean: (field) => `El campo ${field} debe ser verdadero o falso.`,
	isEmail: (field) => `El campo ${field} debe ser un correo electrónico válido.`,
	isUuid: (field) => `El campo ${field} debe ser un identificador válido.`,
	isDate: (field) => `El campo ${field} debe ser una fecha válida.`,
	isDateString: (field) =>
		`El campo ${field} debe ser una fecha válida (formato AAAA-MM-DD).`,
	isArray: (field) => `El campo ${field} debe ser una lista.`,
	isEnum: (field, message) =>
		`El campo ${field} debe ser uno de los siguientes valores: ${allowedValues(message)}.`,
	isIn: (field, message) =>
		`El campo ${field} debe ser uno de los siguientes valores: ${allowedValues(message)}.`,
	minLength: (field, message) =>
		`El campo ${field} debe tener al menos ${boundary(message)} caracteres.`,
	maxLength: (field, message) =>
		`El campo ${field} debe tener como máximo ${boundary(message)} caracteres.`,
	min: (field, message) =>
		`El campo ${field} debe ser mayor o igual a ${boundary(message)}.`,
	max: (field, message) =>
		`El campo ${field} debe ser menor o igual a ${boundary(message)}.`,
	equals: (field) => `El campo ${field} no tiene el valor esperado.`,
	whitelistValidation: (field) => `El campo ${field} no está permitido.`,
};

/**
 * class-validator default messages start with the property name (or with
 * "property"/"each value in" for whitelist and array rules); anything else
 * is a message the DTO declared on purpose and is kept as is.
 */
function isDefaultMessage(
	property: string,
	constraint: string,
	message: string,
): boolean {
	return (
		constraint === 'whitelistValidation' ||
		message.startsWith(`${property} `) ||
		message.startsWith('each value in ')
	);
}

function collectMessages(errors: ValidationError[], parentPath = ''): string[] {
	return errors.flatMap((error) => {
		const field = parentPath ? `${parentPath}.${error.property}` : error.property;

		const own = Object.entries(error.constraints ?? {}).map(
			([constraint, message]) => {
				if (!isDefaultMessage(error.property, constraint, message)) {
					return message;
				}
				const build = SPANISH_MESSAGES[constraint];
				return build ? build(field, message) : `El campo ${field} no es válido.`;
			},
		);

		return [...own, ...collectMessages(error.children ?? [], field)];
	});
}

/**
 * `ValidationPipe` exception factory: answers 400 with one Spanish message
 * per failed rule, keeping the `message: string[]` shape clients already read.
 */
export function validationExceptionFactory(
	errors: ValidationError[],
): BadRequestException {
	return new BadRequestException({
		statusCode: 400,
		message: collectMessages(errors),
		error: 'Bad Request',
	});
}
