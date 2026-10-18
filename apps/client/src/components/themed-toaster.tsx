'use client';

import { useTheme } from '@repo/ui';
import type { ComponentProps } from 'react';
import { Toaster } from 'sonner';

/** Sonner `Toaster` that follows the resolved app theme. */
export function ThemedToaster(props: ComponentProps<typeof Toaster>) {
	const { resolvedTheme } = useTheme();
	return <Toaster theme={resolvedTheme} {...props} />;
}
