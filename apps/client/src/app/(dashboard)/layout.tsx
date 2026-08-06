'use client';

import { useAuth } from '@/lib/auth/provider';
import { isPathAllowedForRole } from '@repo/common';
import { useLogout } from '@repo/hooks';
import { DashboardLayout, Forbidden, LoadingSpinner } from '@repo/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

export default function AppDashboardLayout({
	children,
}: { children: ReactNode }) {
	const { user, isAuthenticated, isLoading, clearUser } = useAuth();
	const logoutMutation = useLogout();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isLoading && (!isAuthenticated || !user)) {
			router.replace('/login');
		}
	}, [isLoading, isAuthenticated, user, router]);

	if (isLoading || !user) {
		return <LoadingSpinner className="min-h-screen" label="Cargando sesión…" />;
	}

	const handleLogout = () => {
		logoutMutation.mutate(undefined, {
			onSettled: () => {
				clearUser();
				router.replace('/login');
			},
		});
	};

	const isAllowed = isPathAllowedForRole(pathname, user.role);

	return (
		<DashboardLayout
			role={user.role}
			user={user}
			currentPath={pathname}
			onLogout={handleLogout}
			LinkComponent={Link}
			onNavigate={(href) => router.push(href)}
		>
			{isAllowed ? (
				children
			) : (
				<Forbidden onBack={() => router.push('/dashboard')} />
			)}
		</DashboardLayout>
	);
}
