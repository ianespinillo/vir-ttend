import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import {
	BusinessRuleError,
	ConflictError,
	DomainError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from '../../../../src/common/errors';
import { HttpExceptionFilter } from '../../../../src/common/filters/http-exception.filter';

// http-exception.filter.spec.ts
describe('HttpExceptionFilter', () => {
	const filter = new HttpExceptionFilter();

	const createHost = () => {
		const response = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const request = { url: '/subjects', method: 'POST' };
		const host = {
			switchToHttp: () => ({
				getResponse: () => response,
				getRequest: () => request,
			}),
		} as unknown as ArgumentsHost;
		return { response, host };
	};

	let errorLog: jest.SpyInstance;
	let warnLog: jest.SpyInstance;

	beforeEach(() => {
		errorLog = jest
			.spyOn(Logger.prototype, 'error')
			.mockImplementation(() => undefined);
		warnLog = jest
			.spyOn(Logger.prototype, 'warn')
			.mockImplementation(() => undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('mapea DomainError a HTTP 400 conservando el mensaje', () => {
		const { response, host } = createHost();

		filter.catch(new DomainError('Schedule overlap detected'), host);

		expect(response.status).toHaveBeenCalledWith(400);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: 400,
				message: 'Schedule overlap detected',
				error: 'Bad Request',
			}),
		);
	});

	it('conserva el status y el mensaje de un HttpException', () => {
		const { response, host } = createHost();

		filter.catch(new BadRequestException('Subject already exists'), host);

		expect(response.status).toHaveBeenCalledWith(400);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: 400,
				message: 'Subject already exists',
			}),
		);
	});

	it('mapea errores genéricos a 500 sin exponer el mensaje', () => {
		const { response, host } = createHost();

		filter.catch(new Error('secret internal detail'), host);

		expect(response.status).toHaveBeenCalledWith(500);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: 500,
				message: 'Ocurrió un error inesperado. Intente nuevamente más tarde.',
				error: 'Internal Server Error',
			}),
		);
		expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain(
			'secret internal detail',
		);
	});

	it.each([
		[new NotFoundError('El curso no existe.'), 404, 'Not Found'],
		[new ConflictError('El curso ya existe.'), 409, 'Conflict'],
		[new ForbiddenError('No tiene permiso.'), 403, 'Forbidden'],
		[new UnauthorizedError('Credenciales inválidas.'), 401, 'Unauthorized'],
		[
			new BusinessRuleError('El horario se superpone.'),
			422,
			'Unprocessable Entity',
		],
	])(
		'mapea %s a su status HTTP conservando el mensaje',
		(exception, status, error) => {
			const { response, host } = createHost();

			filter.catch(exception, host);

			expect(response.status).toHaveBeenCalledWith(status);
			expect(response.json).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: status,
					message: exception.message,
					error,
				}),
			);
		},
	);

	it('trata los errores tipados como DomainError', () => {
		expect(new NotFoundError('x')).toBeInstanceOf(DomainError);
		expect(new BusinessRuleError('x')).toBeInstanceOf(DomainError);
	});

	it('registra los errores 4xx como warning y no como error', () => {
		const { host } = createHost();

		filter.catch(new NotFoundError('El curso no existe.'), host);

		expect(warnLog).toHaveBeenCalledTimes(1);
		expect(errorLog).not.toHaveBeenCalled();
	});

	it('registra los errores 5xx como error con el stack', () => {
		const { host } = createHost();
		const exception = new Error('boom');

		filter.catch(exception, host);

		expect(errorLog).toHaveBeenCalledWith('POST /subjects 500', exception.stack);
		expect(warnLog).not.toHaveBeenCalled();
	});
});
