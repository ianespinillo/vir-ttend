import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { IAcademicUnitOfWorkPort } from '../../domain/ports/unit-of-work.port.interface';

/**
 * MikroORM-backed unit of work. Repositories resolve the active transaction
 * through the EntityManager context, so they join it without extra wiring.
 */
@Injectable()
export class AcademicUnitOfWorkAdapter implements IAcademicUnitOfWorkPort {
	constructor(private readonly em: EntityManager) {}

	run<T>(work: () => Promise<T>): Promise<T> {
		return this.em.transactional(() => work());
	}
}
