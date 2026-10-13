import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { IUnitOfWorkPort } from '../../domain/ports/unit-of-work.port.interface';

/**
 * MikroORM-backed unit of work. Repositories resolve the active transaction
 * through the EntityManager context, so they join it without extra wiring.
 *
 * A unique-constraint violation means a concurrent writer committed the same
 * row first; the work is retried once so it re-reads that committed state
 * (making replays of the same request converge instead of failing).
 */
@Injectable()
export class MikroOrmUnitOfWorkAdapter implements IUnitOfWorkPort {
	constructor(private readonly em: EntityManager) {}

	async run<T>(work: () => Promise<T>): Promise<T> {
		try {
			return await this.em.transactional(() => work());
		} catch (error) {
			if (!(error instanceof UniqueConstraintViolationException)) throw error;
			return this.em.transactional(() => work());
		}
	}
}
