import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

type AfterCommitHook = () => Promise<void>;

/**
 * Lets persistence code schedule side effects (e.g. cache invalidation) that
 * must only happen once the surrounding transaction committed.
 *
 * - Inside `run`, hooks are collected and executed after `work` resolves
 *   (i.e. after the commit); if `work` throws they are discarded.
 * - Outside `run` there is no transaction to wait for, so hooks run immediately.
 *
 * Hooks are best effort: a failing hook never fails the committed work.
 */
@Injectable()
export class AfterCommitQueue {
	private readonly scope = new AsyncLocalStorage<AfterCommitHook[]>();

	async run<T>(work: () => Promise<T>): Promise<T> {
		// A nested scope joins the outer one: hooks wait for the outermost commit.
		if (this.scope.getStore()) return work();

		const hooks: AfterCommitHook[] = [];
		const result = await this.scope.run(hooks, work);
		for (const hook of hooks) {
			await this.safely(hook);
		}
		return result;
	}

	async defer(hook: AfterCommitHook): Promise<void> {
		const hooks = this.scope.getStore();
		if (hooks) {
			hooks.push(hook);
			return;
		}
		await this.safely(hook);
	}

	private async safely(hook: AfterCommitHook): Promise<void> {
		try {
			await hook();
		} catch {
			// best effort: the work already committed
		}
	}
}
