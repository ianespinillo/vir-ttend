'use client';

import {
	type BrandTokens,
	type PublicBranding,
	VIRTTEND_BRANDING,
	deriveBrandTokens,
	publicBrandingSchema,
	resolveAssetUrl,
} from '@repo/branding';
import {
	BRAND_STORAGE_KEY,
	BRAND_STYLE_ELEMENT_ID,
	brandStyleSheet,
} from '@repo/branding/web';
import { apiClient, usePublicConfig } from '@repo/hooks';
import {
	type ReactNode,
	createContext,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/use-isomorphic-layout-effect';

interface BrandContextValue {
	branding: PublicBranding;
	tokens: BrandTokens;
}

export interface BrandValue extends BrandContextValue {
	/** Resolves a branding asset path against the API origin. */
	assetUrl: (path: string | null) => string | null;
}

const DEFAULT_VALUE: BrandContextValue = {
	branding: VIRTTEND_BRANDING,
	tokens: deriveBrandTokens(VIRTTEND_BRANDING.colors),
};

const BrandContext = createContext<BrandContextValue>(DEFAULT_VALUE);

const readCachedBranding = (): PublicBranding | null => {
	try {
		const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
		if (!raw) return null;
		const parsed = publicBrandingSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
};

const writeCachedBranding = (branding: PublicBranding) => {
	try {
		window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(branding));
	} catch {
		// Storage can be unavailable (private mode, blocked site data): the cache is optional.
	}
};

const applyFavicon = (href: string) => {
	let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
	if (!link) {
		link = document.createElement('link');
		link.rel = 'icon';
		document.head.appendChild(link);
	}
	// The default icon declares its own type/sizes; a school favicon may be a different format.
	link.removeAttribute('type');
	link.removeAttribute('sizes');
	link.href = href;
};

const syncBrandStyle = (branding: PublicBranding, tokens: BrandTokens) => {
	const existing = document.getElementById(BRAND_STYLE_ELEMENT_ID);
	if (branding.source !== 'instance') {
		// tokens.css already carries the Vir-ttend defaults.
		existing?.remove();
		return;
	}
	const style = existing ?? document.createElement('style');
	style.id = BRAND_STYLE_ELEMENT_ID;
	style.textContent = brandStyleSheet(tokens);
	if (!existing) document.head.appendChild(style);
};

export function BrandProvider({ children }: { children: ReactNode }) {
	const { data } = usePublicConfig();
	const [cached, setCached] = useState<PublicBranding | null>(null);

	// Read after mount so the first client render matches the server HTML. A layout effect
	// state update is flushed before paint, so the cached brand still shows without a flash.
	useIsomorphicLayoutEffect(() => {
		setCached(readCachedBranding());
	}, []);

	const fresh = data?.branding;
	const branding = fresh ?? cached ?? VIRTTEND_BRANDING;
	const tokens = useMemo(
		() => deriveBrandTokens(branding.colors),
		[branding.colors],
	);
	const value = useMemo(() => ({ branding, tokens }), [branding, tokens]);

	// Only replaces the static default title (or the one this provider set last),
	// so route-level titles set by Next metadata are not overwritten.
	const appliedTitle = useRef<string | null>(null);

	useIsomorphicLayoutEffect(() => {
		syncBrandStyle(branding, tokens);
		if (
			document.title === VIRTTEND_BRANDING.shortName ||
			document.title === appliedTitle.current
		) {
			document.title = branding.shortName;
			appliedTitle.current = branding.shortName;
		}
		if (branding.assets.favicon) {
			const href = resolveAssetUrl(
				branding.assets.favicon,
				apiClient.defaults.baseURL ?? '',
			);
			if (href) applyFavicon(href);
		}
	}, [branding, tokens]);

	useIsomorphicLayoutEffect(() => {
		if (fresh) writeCachedBranding(fresh);
	}, [fresh]);

	return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandValue {
	const { branding, tokens } = useContext(BrandContext);
	return {
		branding,
		tokens,
		assetUrl: (path) => resolveAssetUrl(path, apiClient.defaults.baseURL ?? ''),
	};
}
