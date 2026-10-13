import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { MockProxy, mock } from 'jest-mock-extended';
import { MikroOrmUnitOfWorkAdapter } from '../../../src/modules/attendance/infrastructure/adapters/unit-of-work.adapter';

describe('MikroOrmUnitOfWorkAdapter', () => {
	let em: MockProxy<EntityManager>;
	let adapter: MikroOrmUnitOfWorkAdapter;

	const uniqueViolation = () =>
		new UniqueConstraintViolationException(new Error('duplicate key'));

	beforeEach(() => {
		em = mock<EntityManager>();
		em.transactional.mockImplementation(async (cb) => cb(em));
		adapter = new MikroOrmUnitOfWorkAdapter(em);
	});

	it('runs the work inside a transaction and returns its result', async () => {
		const result = await adapter.run(async () => 'ok');

		expect(result).toBe('ok');
		expect(em.transactional).toHaveBeenCalledTimes(1);
	});

	it('retries once when a concurrent writer caused a unique violation', async () => {
		const work = jest
			.fn<Promise<string>, []>()
			.mockRejectedValueOnce(uniqueViolation())
			.mockResolvedValueOnce('converged');

		const result = await adapter.run(work);

		expect(result).toBe('converged');
		expect(work).toHaveBeenCalledTimes(2);
		expect(em.transactional).toHaveBeenCalledTimes(2);
	});

	it('does not retry more than once', async () => {
		const work = jest.fn().mockRejectedValue(uniqueViolation());

		await expect(adapter.run(work)).rejects.toBeInstanceOf(
			UniqueConstraintViolationException,
		);
		expect(work).toHaveBeenCalledTimes(2);
	});

	it('does not retry other errors', async () => {
		const work = jest.fn().mockRejectedValue(new Error('boom'));

		await expect(adapter.run(work)).rejects.toThrow('boom');
		expect(work).toHaveBeenCalledTimes(1);
	});
});
