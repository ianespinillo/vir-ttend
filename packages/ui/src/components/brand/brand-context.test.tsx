import type { PublicBranding } from '@repo/branding';
import { VIRTTEND_BRANDING } from '@repo/branding';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandProvider } from './brand-context';

const publicConfig = vi.hoisted(() => ({
	branding: undefined as PublicBranding | undefined,
	tenancyMode: undefined as 'single' | 'multi' | undefined,
	tenantName: undefined as string | undefined,
}));

vi.mock('@repo/hooks', () => ({
	usePublicConfig: () => ({
		data: {
			branding: publicConfig.branding,
			tenancyMode: publicConfig.tenancyMode,
			tenantName: publicConfig.tenantName,
		},
	}),
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

describe('BrandProvider Title and Favicon', () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.title = '';
		document.head
			.querySelectorAll('link[rel~="icon"]')
			.forEach((l) => l.remove());
		publicConfig.branding = undefined;
		publicConfig.tenancyMode = undefined;
		publicConfig.tenantName = undefined;
	});

	it('multi-tenant: sets document.title to "Virttend" and favicon to "/icon.svg"', () => {
		publicConfig.branding = VIRTTEND_BRANDING;
		publicConfig.tenancyMode = 'multi';

		render(
			<BrandProvider>
				<div>Content</div>
			</BrandProvider>,
		);

		expect(document.title).toBe('Virttend');
		const iconLink = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
		expect(iconLink).not.toBeNull();
		expect(iconLink?.href).toContain('/icon.svg');
	});

	it('single-tenant with instance branding: sets document.title to "Virttend | <shortName>" and favicon to school favicon', () => {
		publicConfig.branding = EEST3;
		publicConfig.tenancyMode = 'single';

		render(
			<BrandProvider>
				<div>Content</div>
			</BrandProvider>,
		);

		expect(document.title).toBe('Virttend | EEST N.º 3');
		const iconLink = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
		expect(iconLink).not.toBeNull();
		expect(iconLink?.href).toBe(
			'http://localhost:3001/branding/favicon.ico?v=abc1234567',
		);
	});

	it('single-tenant without instance branding: uses tenantName in document.title', () => {
		publicConfig.branding = VIRTTEND_BRANDING;
		publicConfig.tenancyMode = 'single';
		publicConfig.tenantName = 'Colegio San Martín';

		render(
			<BrandProvider>
				<div>Content</div>
			</BrandProvider>,
		);

		expect(document.title).toBe('Virttend | Colegio San Martín');
		const iconLink = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
		expect(iconLink).not.toBeNull();
		expect(iconLink?.href).toContain('/icon.svg');
	});

	it('does not overwrite route-specific titles set by sub-pages', () => {
		document.title = 'Reporte Mensual — 3º 1ª';
		publicConfig.branding = EEST3;
		publicConfig.tenancyMode = 'single';

		render(
			<BrandProvider>
				<div>Content</div>
			</BrandProvider>,
		);

		expect(document.title).toBe('Reporte Mensual — 3º 1ª');
	});
});
