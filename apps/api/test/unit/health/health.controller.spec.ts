// health.controller.spec.ts
import { EntityManager } from '@mikro-orm/postgresql';
import { ServiceUnavailableException } from '@nestjs/common';
import Redis from 'ioredis';
import { MockProxy, mock } from 'jest-mock-extended';
import { HealthController } from '../../../src/modules/health/health.controller';

describe('HealthController', () => {
	let controller: HealthController;
	let em: MockProxy<EntityManager>;
	let redis: MockProxy<Redis>;

	beforeEach(() => {
		em = mock<EntityManager>();
		redis = mock<Redis>();
		controller = new HealthController(em, redis);
	});

	it('check retorna status ok', () => {
		const result = controller.check();
		expect(result.status).toBe('ok');
		expect(result.timestamp).toEqual(expect.any(String));
		expect(result.version).toEqual(expect.any(String));
	});

	it('checkDb retorna up cuando la conexión responde', async () => {
		(em.getConnection as unknown as jest.Mock).mockReturnValue({
			execute: jest.fn().mockResolvedValue([]),
		});

		const result = await controller.checkDb();

		expect(result).toEqual({ status: 'ok', db: 'up' });
		expect(em.getConnection().execute).toHaveBeenCalledWith('SELECT 1');
	});

	it('checkDb lanza ServiceUnavailable cuando la conexión falla', async () => {
		(em.getConnection as unknown as jest.Mock).mockReturnValue({
			execute: jest.fn().mockRejectedValue(new Error('down')),
		});

		await expect(controller.checkDb()).rejects.toThrow(
			ServiceUnavailableException,
		);
	});

	it('checkRedis retorna up cuando ping responde PONG', async () => {
		redis.ping.mockResolvedValue('PONG');

		const result = await controller.checkRedis();

		expect(result).toEqual({ status: 'ok', redis: 'up' });
	});

	it('checkRedis lanza ServiceUnavailable cuando ping falla', async () => {
		redis.ping.mockRejectedValue(new Error('down'));

		await expect(controller.checkRedis()).rejects.toThrow(
			ServiceUnavailableException,
		);
	});

	it('checkRedis lanza ServiceUnavailable con respuesta inesperada', async () => {
		redis.ping.mockResolvedValue('PONGFAKE');

		await expect(controller.checkRedis()).rejects.toThrow(
			ServiceUnavailableException,
		);
	});
});
