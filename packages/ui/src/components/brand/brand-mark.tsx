'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useBrand } from './brand-context';
import { VirttendSeal } from './virttend-seal';

const SIZES = { sm: 24, md: 40, lg: 56 } as const;

export interface BrandMarkProps {
	size?: keyof typeof SIZES;
	className?: string;
}

export function BrandMark({ size = 'md', className }: BrandMarkProps) {
	const { branding, assetUrl } = useBrand();
	const px = SIZES[size];
	const crest = branding.assets.crestSmall;
	// A crest that fails to load (missing or mismatched branding mount) degrades
	// to the Vir-ttend seal instead of a broken image.
	const [crestFailed, setCrestFailed] = useState(false);

	if (branding.source === 'virttend' || !crest || crestFailed) {
		return <VirttendSeal size={px} className={className} />;
	}

	return (
		<span
			className={cn('relative inline-flex shrink-0', className)}
			style={{ width: px, height: px }}
		>
			<img
				src={assetUrl(crest) ?? undefined}
				alt={branding.shortName}
				width={px}
				height={px}
				className="size-full object-contain"
				onError={() => setCrestFailed(true)}
			/>
			<VirttendSeal
				size={Math.round(px * 0.4)}
				ring="hsl(var(--background))"
				className="absolute -top-1 -right-2"
			/>
		</span>
	);
}
