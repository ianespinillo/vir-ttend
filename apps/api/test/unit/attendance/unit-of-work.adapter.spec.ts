import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { MockProxy, mock } from 'jest-mock-extended';
import { MikroOrmUnitOfWorkAdapter } from '../../../src/modules/attendance/infrastructure/adapters/unit-of-work.adapter';
import { AfterCommitQueue } from '../../../src/modules/attendance/infrastructure/persistence/after-commit.queue';

describe('MikroOrmUnitOfWorkAdapter', () => {
	let em: MockProxy<EntityManager>;
	let adapter: MikroOrmUnitOfWorkAdapter;
	let afterCommit: AfterCommitQueue;

	const uniqueViolation = () =>
		new UniqueConstraintViolationException(new Error('duplicate key'));

	beforeEach(() => {
		em = mock<EntityManager>();
		em.transactional.mockImplementation(async (cb) => cb(em));
		afterCommit = new AfterCommitQueue();
		adapter = new MikroOrmUnitOfWorkAdapter(em, afterCommit);
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

	describe('after-commit hooks', () => {
		it('runs deferred hooks only after the transaction committed', async () => {
			const order: string[] = [];
			em.transactional.mockImplementation(async (cb) => {
				const result = await cb(em);
				order.push('commit');
				return result;
			});

			await adapter.run(async () => {
				await afterCommit.defer(async () => {
					order.push('hook');
				});
				order.push('work');
			});

			expect(order).toEqual(['work', 'commit', 'hook']);
		});

		it('discards hooks when the transaction throws', async () => {
			const hook = jest.fn().mockResolvedValue(undefined);

			await expect(
				adapter.run(async () => {
					await afterCommit.defer(hook);
					throw new Error('boom');
				}),
			).rejects.toThrow('boom');

			expect(hook).not.toHaveBeenCalled();
		});

		it('drops the hooks of a rolled-back attempt and keeps the retry ones', async () => {
			const firstAttempt = jest.fn().mockResolvedValue(undefined);
			const retryAttempt = jest.fn().mockResolvedValue(undefined);
			const work = jest
				.fn<Promise<void>, []>()
				.mockImplementationOnce(async () => {
					await afterCommit.defer(firstAttempt);
					throw uniqueViolation();
				})
				.mockImplementationOnce(async () => {
					await afterCommit.defer(retryAttempt);
				});

			await adapter.run(work);

			expect(firstAttempt).not.toHaveBeenCalled();
			expect(retryAttempt).toHaveBeenCalledTimes(1);
		});

		it('does not fail committed work when a hook fails', async () => {
			const result = await adapter.run(async () => {
				await afterCommit.defer(async () => {
					throw new Error('redis down');
				});
				return 'ok';
			});

			expect(result).toBe('ok');
		});
	});
});
