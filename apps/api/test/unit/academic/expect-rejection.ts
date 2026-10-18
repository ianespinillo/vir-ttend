/**
 * Asserts that `promise` rejects with an instance of `type` carrying exactly
 * `message`, so a spec pins both the HTTP status (through the error class)
 * and the text the user reads.
 */
export async function expectRejection(
	promise: Promise<unknown>,
	type: new (message: string) => Error,
	message: string,
): Promise<void> {
	const error = await promise.then(
		() => undefined,
		(reason: unknown) => reason,
	);
	expect(error).toBeInstanceOf(type);
	expect((error as Error).message).toBe(message);
}

/** Synchronous counterpart of {@link expectRejection}. */
export function expectThrow(
	fn: () => unknown,
	type: new (message: string) => Error,
	message: string,
): void {
	expect(fn).toThrow(type);
	expect(fn).toThrow(message);
}
