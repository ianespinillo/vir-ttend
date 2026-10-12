import { describe, expect, it } from 'vitest';
import { resolveAssetUrl } from './urls.js';

describe('resolveAssetUrl', () => {
	it('returns null for a null path', () => {
		expect(resolveAssetUrl(null, 'https://x.org/api')).toBeNull();
	});

	it('returns an absolute path unchanged', () => {
		expect(resolveAssetUrl('https://cdn.x.org/a.png', 'https://x.org/api')).toBe(
			'https://cdn.x.org/a.png',
		);
	});

	it('resolves against the origin of an absolute API url', () => {
		expect(resolveAssetUrl('/branding/a.png?v=1', 'https://x.org/api')).toBe(
			'https://x.org/branding/a.png?v=1',
		);
		expect(resolveAssetUrl('/branding/a.png?v=1', 'http://localhost:3001')).toBe(
			'http://localhost:3001/branding/a.png?v=1',
		);
	});

	it('keeps the path for a relative API url (same origin)', () => {
		expect(resolveAssetUrl('/branding/a.png?v=1', '/api')).toBe(
			'/branding/a.png?v=1',
		);
	});
});
