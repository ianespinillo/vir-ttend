import { EntityManager } from '@mikro-orm/postgresql';
import {
	Controller,
	Get,
	Inject,
	ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../shared/cache/cache.module';

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(
		private readonly em: EntityManager,
		@Inject(REDIS_CLIENT) private readonly redis: Redis,
	) {}

	@Get()
	@ApiOperation({
		summary: 'Health check de la API',
		description:
			'Devuelve el estado operativo del servicio de la API, con timestamp y versión.',
	})
	@ApiResponse({
		status: 200,
		description:
			'Servicio operativo. Respuesta: { status: "ok", timestamp: "2026-08-02T12:30:00.000Z", version: "1.0.0" }',
	})
	check() {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version ?? 'dev',
		};
	}

	@Get('db')
	@ApiOperation({
		summary: 'Health check de la base de datos',
		description:
			'Verifica la conexión a la base de datos PostgreSQL ejecutando una consulta de prueba.',
	})
	@ApiResponse({
		status: 200,
		description: 'Base de datos operativa. Respuesta: { status: "ok", db: "up" }',
	})
	@ApiResponse({
		status: 503,
		description:
			'Base de datos no disponible. Respuesta: { statusCode, timestamp, path, method, message, error }',
	})
	async checkDb() {
		try {
			await this.em.getConnection().execute('SELECT 1');
			return { status: 'ok', db: 'up' };
		} catch {
			throw new ServiceUnavailableException({ status: 'error', db: 'down' });
		}
	}

	@Get('redis')
	@ApiOperation({
		summary: 'Health check de Redis',
		description: 'Verifica la conexión a Redis enviando un ping de prueba.',
	})
	@ApiResponse({
		status: 200,
		description: 'Redis operativo. Respuesta: { status: "ok", redis: "up" }',
	})
	@ApiResponse({
		status: 503,
		description:
			'Redis no disponible. Respuesta: { statusCode, timestamp, path, method, message, error }',
	})
	async checkRedis() {
		try {
			const pong = await this.redis.ping();
			if (pong !== 'PONG') {
				throw new Error('Unexpected ping response');
			}
			return { status: 'ok', redis: 'up' };
		} catch {
			throw new ServiceUnavailableException({ status: 'error', redis: 'down' });
		}
	}
}
