import type { PublicBranding } from '@repo/branding';
import { VIRTTEND_BRANDING } from '@repo/branding';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandProvider } from './brand-context';
import { BrandMark } from './brand-mark';

const publicConfig = vi.hoisted(() => ({
	branding: undefined as PublicBranding | undefined,
}));

vi.mock('@repo/hooks', () => ({
	usePublicConfig: () => ({ data: { branding: publicConfig.branding } }),
	apiClient: { defaults: { baseURL: 'http://localhost:3001' } },
}));

const EEST3: PublicBranding = {
	source: 'instance',
	version: 'abc1234567',
	displayName: 'Escuela de Educación Secundaria Técnica N.º 3 «Eva Perón»',
	shortName: 'EEST N.º 3',
	colors: { primary: '#023064', accent: '#0195EF', highlight: '#F9D648' },
	assets: {
		crest: '/branding/crest.png?v=abc1234567',
		crestSmall: '/branding/crest-small.svg?v=abc1234567',
		crestSmallPng: '/branding/crest-small-256.png?v=abc1234567',
		favicon: '/branding/favicon.ico?v=abc1234567',
	},
	showPoweredBy: true,
};

const renderMark = () =>
	render(
		<BrandProvider>
			<BrandMark />
		</BrandProvider>,
	);

describe('BrandMark', () => {
	beforeEach(() => {
		window.localStorage.clear();
		publicConfig.branding = undefined;
	});

	it('multi: renders only the Vir-ttend seal', () => {
		publicConfig.branding = VIRTTEND_BRANDING;
		const { container } = renderMark();
		expect(screen.getByRole('img', { name: 'Vir-ttend' })).toBeInTheDocument();
		expect(container.querySelector('img')).toBeNull();
	});

	it('single: renders the school crest with the Vir-ttend seal', () => {
		publicConfig.branding = EEST3;
		const { container } = renderMark();
		const crest = screen.getByAltText('EEST N.º 3');
		expect(crest.getAttribute('src')).toMatch(/crest-small\.svg\?v=abc1234567$/);
		expect(crest.getAttribute('src')).toBe(
			'http://localhost:3001/branding/crest-small.svg?v=abc1234567',
		);
		expect(container.querySelector('svg[aria-label="Vir-ttend"]')).not.toBeNull();
	});
});
