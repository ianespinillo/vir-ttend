/**
 * A pending self-service password reset. Only the SHA-256 of the code is kept,
 * never the code itself.
 */
export interface PasswordResetCodeEntry {
	codeHash: string;
	/** Wrong codes submitted so far. */
	attempts: number;
	/** Epoch millis when the code was issued (drives the resend cooldown). */
	issuedAt: number;
}

export interface IPasswordResetCodeRepository {
	/** Stores (or replaces) the user's pending code; it expires after `ttlSeconds`. */
	save(
		userId: string,
		entry: PasswordResetCodeEntry,
		ttlSeconds: number,
	): Promise<void>;
	find(userId: string): Promise<PasswordResetCodeEntry | null>;
	/** Counts one more wrong attempt without extending the expiry. */
	incrementAttempts(userId: string): Promise<void>;
	delete(userId: string): Promise<void>;
}
