import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { DomainError } from '../../../../src/common/errors/domain.error';
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

	beforeEach(() => {
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
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
				message: 'Internal server error',
			}),
		);
	});
});
