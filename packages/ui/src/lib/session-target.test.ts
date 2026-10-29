import { describe, expect, it } from 'vitest';
import { isSameSessionTarget } from './session-target';

describe('isSameSessionTarget', () => {
	const requested = { id: 'c-1', date: '2026-03-10' };

	it('matches the same course and date', () => {
		expect(isSameSessionTarget(requested, { ...requested })).toBe(true);
	});

	it('does not match another date', () => {
		expect(
			isSameSessionTarget(requested, { id: 'c-1', date: '2026-03-11' }),
		).toBe(false);
	});

	it('does not match another course or commission', () => {
		expect(
			isSameSessionTarget(requested, { id: 'c-2', date: '2026-03-10' }),
		).toBe(false);
	});
});
