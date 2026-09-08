'use client';

import { useAuth } from '@/lib/auth/provider';
import { isPathAllowedForRole } from '@repo/common';
import { useAlertsCount, useExitTenant, useLogout } from '@repo/hooks';
import { DashboardLayout, Forbidden, LoadingSpinner } from '@repo/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

export default function AppDashboardLayout({
	children,
}: { children: ReactNode }) {
	const { user, isAuthenticated, isLoading, clearUser, setUser } = useAuth();
	const logoutMutation = useLogout();
	const exitTenantMutation = useExitTenant();
	const { data: alertsCount } = useAlertsCount();
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

	const handleExitImpersonation = () => {
		exitTenantMutation.mutate(undefined, {
			onSuccess: (updatedUser) => {
				setUser(updatedUser);
				router.replace('/tenants');
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
			alertCount={alertsCount?.count}
			isImpersonating={user.isImpersonating}
			tenantName={user.tenantName}
			onExitImpersonation={handleExitImpersonation}
			isExitingImpersonation={exitTenantMutation.isPending}
		>
			{isAllowed ? (
				children
			) : (
				<Forbidden onBack={() => router.push('/dashboard')} />
			)}
		</DashboardLayout>
	);
}
