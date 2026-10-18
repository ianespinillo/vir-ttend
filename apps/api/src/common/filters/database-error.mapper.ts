import {
	CheckConstraintViolationException,
	DriverException,
	ForeignKeyConstraintViolationException,
	NotNullConstraintViolationException,
	UniqueConstraintViolationException,
} from '@mikro-orm/core';
import { HttpStatus } from '@nestjs/common';

/** PostgreSQL `invalid_text_representation`, e.g. a malformed UUID. */
const INVALID_TEXT_REPRESENTATION = '22P02';

export interface MappedDatabaseError {
	statusCode: HttpStatus;
	message: string;
	error: string;
}

/**
 * Maps the database errors a user can cause to a status and a Spanish
 * message, without exposing SQL. Returns `undefined` for anything else
 * (connection loss, syntax errors...), which stays a 500.
 */
export function mapDatabaseError(
	exception: unknown,
): MappedDatabaseError | undefined {
	if (exception instanceof UniqueConstraintViolationException) {
		return {
			statusCode: HttpStatus.CONFLICT,
			message: 'Ya existe un registro con esos datos.',
			error: 'Conflict',
		};
	}

	if (exception instanceof ForeignKeyConstraintViolationException) {
		// Deleting or updating a referenced row reads "update or delete on table".
		const isInUse = exception.message.includes('update or delete on table');
		return {
			statusCode: HttpStatus.CONFLICT,
			message: isInUse
				? 'No se puede eliminar el registro porque tiene información asociada.'
				: 'La operación hace referencia a un registro que no existe.',
			error: 'Conflict',
		};
	}

	if (exception instanceof NotNullConstraintViolationException) {
		return {
			statusCode: HttpStatus.BAD_REQUEST,
			message: 'Faltan datos obligatorios.',
			error: 'Bad Request',
		};
	}

	if (exception instanceof CheckConstraintViolationException) {
		return {
			statusCode: HttpStatus.BAD_REQUEST,
			message: 'Alguno de los datos enviados no es válido.',
			error: 'Bad Request',
		};
	}

	if (
		exception instanceof DriverException &&
		exception.code === INVALID_TEXT_REPRESENTATION
	) {
		return {
			statusCode: HttpStatus.BAD_REQUEST,
			message: 'Alguno de los datos enviados no tiene un formato válido.',
			error: 'Bad Request',
		};
	}

	return undefined;
}
