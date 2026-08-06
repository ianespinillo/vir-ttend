'use client';

import { useAuth } from '@/lib/auth/provider';
import { AuthLayout, LoadingSpinner } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.replace('/dashboard');
		}
	}, [isLoading, isAuthenticated, router]);

	if (isLoading) {
		return <LoadingSpinner className="min-h-screen" label="Cargando sesión…" />;
	}

	return <AuthLayout>{children}</AuthLayout>;
}
