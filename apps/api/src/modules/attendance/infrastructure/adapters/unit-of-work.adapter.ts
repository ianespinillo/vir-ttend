import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { IUnitOfWorkPort } from '../../domain/ports/unit-of-work.port.interface';
import { AfterCommitQueue } from '../persistence/after-commit.queue';

/**
 * MikroORM-backed unit of work. Repositories resolve the active transaction
 * through the EntityManager context, so they join it without extra wiring.
 *
 * A unique-constraint violation means a concurrent writer committed the same
 * row first; the work is retried once so it re-reads that committed state
 * (making replays of the same request converge instead of failing).
 *
 * Side effects that repositories defer through `AfterCommitQueue` (cache
 * invalidation) run only after the transaction committed; a rolled-back
 * attempt discards them.
 */
@Injectable()
export class MikroOrmUnitOfWorkAdapter implements IUnitOfWorkPort {
	constructor(
		private readonly em: EntityManager,
		private readonly afterCommit: AfterCommitQueue,
	) {}

	async run<T>(work: () => Promise<T>): Promise<T> {
		try {
			return await this.attempt(work);
		} catch (error) {
			if (!(error instanceof UniqueConstraintViolationException)) throw error;
			return this.attempt(work);
		}
	}

	private attempt<T>(work: () => Promise<T>): Promise<T> {
		return this.afterCommit.run(() => this.em.transactional(() => work()));
	}
}
