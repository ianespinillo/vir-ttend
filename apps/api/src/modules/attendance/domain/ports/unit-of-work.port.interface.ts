/**
 * Runs a piece of work atomically: every repository call made inside `work`
 * either commits together or is rolled back together.
 */
export interface IUnitOfWorkPort {
	run<T>(work: () => Promise<T>): Promise<T>;
}
