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

interface ErrorResponse {
	statusCode: number;
	timestamp: string;
	path: string;
	method: string;
	message: string | string[];
	error: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const { statusCode, message, error } = this.extractErrorDetails(exception);

		const errorResponse: ErrorResponse = {
			statusCode,
			timestamp: new Date().toISOString(),
			path: request.url,
			method: request.method,
			message,
			error,
		};

		this.logger.error(
			`${request.method} ${request.url} ${statusCode}`,
			exception instanceof Error ? exception.stack : String(exception),
		);

		response.status(statusCode).json(errorResponse);
	}

	private extractErrorDetails(exception: unknown): {
		statusCode: number;
		message: string | string[];
		error: string;
	} {
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
				};
			}

			return {
				statusCode: status,
				message: exception.message,
				error: 'Error',
			};
		}

		// Errores no controlados (500)
		return {
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
			error: 'Internal Server Error',
		};
	}
}
