'use client';

import { type ReactNode, useEffect, useState } from 'react';

export type Platform = 'android' | 'ios' | 'desktop';

const detectPlatform = (): Platform => {
	const ua = navigator.userAgent;
	if (/android/i.test(ua)) return 'android';
	// iPadOS reports a desktop Mac user agent, but exposes touch points.
	if (
		/iphone|ipad|ipod/i.test(ua) ||
		(/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
	) {
		return 'ios';
	}
	return 'desktop';
};

/**
 * Marks its subtree with the visitor's platform (`data-platform`), so server
 * rendered children can restyle themselves with `group-data-[platform=...]`
 * variants. Before hydration (and without JS) the platform is `desktop`, which
 * shows every option equally.
 */
export function PlatformScope({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const [platform, setPlatform] = useState<Platform>('desktop');

	useEffect(() => {
		setPlatform(detectPlatform());
	}, []);

	return (
		<div data-platform={platform} className={`group/platform ${className ?? ''}`}>
			{children}
		</div>
	);
}
