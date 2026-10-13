'use client';

import { useAuth } from '@/lib/auth/provider';
import {
	type ChangePasswordInput,
	ROLES,
	isPathAllowedForRole,
} from '@repo/common';
import {
	useAlertsCount,
	useChangePassword,
	useExitTenant,
	useLogout,
	usePublicConfig,
	useSelectTenant,
	useTenants,
} from '@repo/hooks';
import {
	DashboardLayout,
	Forbidden,
	ForceChangePasswordDialog,
	LoadingSpinner,
} from '@repo/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AppDashboardLayout({
	children,
}: { children: ReactNode }) {
	const { user, isAuthenticated, isLoading, clearUser, setUser, refetchUser } =
		useAuth();
	const logoutMutation = useLogout();
	const exitTenantMutation = useExitTenant();
	const selectTenantMutation = useSelectTenant();
	const changePasswordMutation = useChangePassword();
	const { data: alertsCount } = useAlertsCount();
	const { data: publicConfig } = usePublicConfig();
	const router = useRouter();
	const pathname = usePathname();

	const [changePasswordError, setChangePasswordError] = useState<string | null>(
		null,
	);

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

	const handleForceChangePassword = async (data: ChangePasswordInput) => {
		setChangePasswordError(null);
		try {
			await changePasswordMutation.mutateAsync(data);
			toast.success('Contraseña actualizada exitosamente');
			const updated = await refetchUser();
			if (updated.data) {
				setUser(updated.data);
			} else {
				setUser({ ...user, mustChangePassword: false });
			}
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			const msg =
				errorObj?.response?.data?.message ||
				errorObj?.message ||
				'Error al cambiar la contraseña. Verificá que la contraseña actual sea la que recibiste por correo.';
			setChangePasswordError(msg);
			toast.error(msg);
		}
	};

	const isAllowed = isPathAllowedForRole(pathname, user.role, { tenancyMode });

	return (
		<>
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

			<ForceChangePasswordDialog
				open={Boolean(user.mustChangePassword)}
				onSubmit={handleForceChangePassword}
				isLoading={changePasswordMutation.isPending}
				onLogout={handleLogout}
				errorMessage={changePasswordError}
			/>
		</>
	);
}
