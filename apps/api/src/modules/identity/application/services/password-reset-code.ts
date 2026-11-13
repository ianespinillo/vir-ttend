import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

/** How long an emailed code stays valid. */
export const PASSWORD_RESET_CODE_TTL_MINUTES = 15;
/** Wrong codes allowed before the pending reset is discarded. */
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;
/** Minimum wait between two emails for the same account. */
export const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000;

/** A uniformly random 6-digit code, zero padded. */
export const generatePasswordResetCode = (): string =>
	randomInt(0, 1_000_000).toString().padStart(6, '0');

export const hashPasswordResetCode = (code: string): string =>
	createHash('sha256').update(code).digest('hex');

/** Constant-time comparison of a submitted code against the stored hash. */
export const passwordResetCodeMatches = (
	code: string,
	storedHash: string,
): boolean => {
	const submitted = Buffer.from(hashPasswordResetCode(code), 'hex');
	const stored = Buffer.from(storedHash, 'hex');
	return (
		submitted.length === stored.length && timingSafeEqual(submitted, stored)
	);
};
