'use client';

import { useAuth } from '@/lib/auth/provider';
import { LoadingSpinner } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoading) {
			return;
		}
		router.replace(isAuthenticated ? '/dashboard' : '/login');
	}, [isAuthenticated, isLoading, router]);

	if (isLoading) {
		return <LoadingSpinner className="min-h-screen" label="Cargando…" />;
	}

	return null;
}
