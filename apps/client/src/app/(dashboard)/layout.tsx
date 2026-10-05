'use client';

import { useAuth } from '@/lib/auth/provider';
import { ROLES, isPathAllowedForRole } from '@repo/common';
import {
	useAlertsCount,
	useExitTenant,
	useLogout,
	usePublicConfig,
	useSelectTenant,
	useTenants,
} from '@repo/hooks';
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
	const selectTenantMutation = useSelectTenant();
	const { data: alertsCount } = useAlertsCount();
	const { data: publicConfig } = usePublicConfig();
	const router = useRouter();
	const pathname = usePathname();

	const tenancyMode =
		publicConfig?.tenancyMode ||
		(process.env.NEXT_PUBLIC_TENANCY_MODE as 'multi' | 'single') ||
		'multi';
	const isSingle = tenancyMode === 'single';

	const isSuperAdminOrImpersonating = Boolean(
		!isSingle && (user?.role === ROLES.SUPERADMIN || user?.isImpersonating),
	);

	const { data: tenants } = useTenants({
		enabled: isSuperAdminOrImpersonating,
	});

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
				router.replace('/dashboard');
			},
		});
	};

	const handleSelectTenant = (tenantId: string) => {
		selectTenantMutation.mutate(
			{ userId: user.id, tenantId },
			{
				onSuccess: (updatedUser) => {
					setUser(updatedUser);
					router.replace('/dashboard');
				},
			},
		);
	};

	const isAllowed = isPathAllowedForRole(pathname, user.role, { tenancyMode });

	return (
		<DashboardLayout
			role={user.role}
			user={user}
			currentPath={pathname}
			onLogout={handleLogout}
			LinkComponent={Link}
			onNavigate={(href) => router.push(href)}
			alertCount={alertsCount?.count}
			isImpersonating={isSingle ? false : user.isImpersonating}
			tenantName={user.tenantName || publicConfig?.tenantName}
			currentTenantId={user.tenantId ?? undefined}
			tenants={isSingle ? undefined : tenants}
			tenancyMode={tenancyMode}
			onSelectTenant={isSingle ? undefined : handleSelectTenant}
			onExitImpersonation={isSingle ? undefined : handleExitImpersonation}
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
