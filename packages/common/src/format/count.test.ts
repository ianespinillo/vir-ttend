import { describe, expect, it } from 'vitest';
import { formatCount } from './count.js';

describe('formatCount', () => {
	it('prints whole numbers without decimals', () => {
		expect(formatCount(10)).toBe('10');
		expect(formatCount(0)).toBe('0');
	});

	it('uses the decimal comma for the 0.25 steps', () => {
		expect(formatCount(12.5)).toBe('12,5');
		expect(formatCount(10.25)).toBe('10,25');
		expect(formatCount(0.75)).toBe('0,75');
	});

	it('keeps at most 2 decimals', () => {
		expect(formatCount(1 / 3)).toBe('0,33');
		expect(formatCount(2.999)).toBe('3');
	});

	it('returns a dash for NaN or invalid numbers', () => {
		expect(formatCount(Number.NaN)).toBe('-');
	});
});
