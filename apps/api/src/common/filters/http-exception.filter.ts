// src/common/filters/http-exception.filter.ts
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
	BusinessRuleError,
	ConflictError,
	DomainError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from '../errors';
import { mapDatabaseError } from './database-error.mapper';

const UNEXPECTED_ERROR_MESSAGE =
	'Ocurrió un error inesperado. Intente nuevamente más tarde.';

/** Status and reason phrase for each typed domain error, most specific first. */
const DOMAIN_ERROR_STATUS: ReadonlyArray<
	[new (message: string) => DomainError, HttpStatus, string]
> = [
	[NotFoundError, HttpStatus.NOT_FOUND, 'Not Found'],
	[ConflictError, HttpStatus.CONFLICT, 'Conflict'],
	[ForbiddenError, HttpStatus.FORBIDDEN, 'Forbidden'],
	[UnauthorizedError, HttpStatus.UNAUTHORIZED, 'Unauthorized'],
	[BusinessRuleError, HttpStatus.UNPROCESSABLE_ENTITY, 'Unprocessable Entity'],
];

interface ErrorResponse {
	statusCode: number;
	timestamp: string;
	path: string;
	method: string;
	message: string | string[];
	error: string;
	details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const { statusCode, message, error, details } =
			this.extractErrorDetails(exception);

		const errorResponse: ErrorResponse = {
			statusCode,
			timestamp: new Date().toISOString(),
			path: request.url,
			method: request.method,
			message,
			error,
			...(details === undefined ? {} : { details }),
		};

		const summary = `${request.method} ${request.url} ${statusCode}`;
		if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
			this.logger.error(
				summary,
				exception instanceof Error ? exception.stack : String(exception),
			);
		} else {
			this.logger.warn(`${summary} ${JSON.stringify(message)}`);
		}

		response.status(statusCode).json(errorResponse);
	}

	private extractErrorDetails(exception: unknown): {
		statusCode: number;
		message: string | string[];
		error: string;
		details?: unknown;
	} {
		if (exception instanceof DomainError) {
			const match = DOMAIN_ERROR_STATUS.find(
				([errorClass]) => exception instanceof errorClass,
			);
			if (match) {
				const [, statusCode, error] = match;
				return { statusCode, message: exception.message, error };
			}
			return {
				statusCode: HttpStatus.BAD_REQUEST,
				message: exception.message,
				error: 'Bad Request',
			};
		}

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			// class-validator devuelve un objeto con array de mensajes
			if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
				const res = exceptionResponse as Record<string, unknown>;
				return {
					statusCode: status,
					message: (res.message as string | string[]) ?? exception.message,
					error: (res.error as string) ?? 'Error',
					details: res.details,
				};
			}

			return {
				statusCode: status,
				message: exception.message,
				error: 'Error',
			};
		}

		const databaseError = mapDatabaseError(exception);
		if (databaseError) {
			return databaseError;
		}

		// Errores no controlados (500)
		return {
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			message: UNEXPECTED_ERROR_MESSAGE,
			error: 'Internal Server Error',
		};
	}
}
