'use client';

import { useAuth } from '@/lib/auth/provider';
import { APP_ROUTES } from '@repo/common';
import { useSelectTenant } from '@repo/hooks';
import { TenantsPage } from '@repo/ui';
import { useRouter } from 'next/navigation';

export default function TenantsRoute() {
	const router = useRouter();
	const { user, setUser } = useAuth();
	const selectTenant = useSelectTenant();

	return (
		<TenantsPage
			currentTenantId={user?.tenantId}
			onTenantClick={(tenant) => router.push(`${APP_ROUTES.tenants}/${tenant.id}`)}
			onEnter={(tenant) =>
				selectTenant.mutate(
					{ userId: user?.id ?? '', tenantId: tenant.id },
					{
						onSuccess: (updatedUser) => {
							setUser(updatedUser);
							router.replace(APP_ROUTES.dashboard);
						},
					},
				)
			}
			enteringId={
				selectTenant.isPending ? (selectTenant.variables?.tenantId ?? null) : null
			}
		/>
	);
}
