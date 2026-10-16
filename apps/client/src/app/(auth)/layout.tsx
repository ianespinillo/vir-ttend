'use client';

import { useAuth } from '@/lib/auth/provider';
import { AuthLayout, LoadingSpinner } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

/** Returns the `redirect` query param when it is a same-origin path, else `/dashboard`. */
function safeRedirectTarget(search: string): string {
	const target = new URLSearchParams(search).get('redirect');
	if (target?.startsWith('/') && !target.startsWith('//')) {
		return target;
	}
	return '/dashboard';
}

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.replace(safeRedirectTarget(window.location.search));
		}
	}, [isLoading, isAuthenticated, router]);

	if (isLoading) {
		return <LoadingSpinner className="min-h-screen" label="Cargando sesión…" />;
	}

	return <AuthLayout>{children}</AuthLayout>;
}
