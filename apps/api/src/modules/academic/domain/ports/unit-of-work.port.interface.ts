/** Runs the given work atomically: everything commits together or nothing does. */
export interface IUnitOfWorkPort {
	run<T>(work: () => Promise<T>): Promise<T>;
}
