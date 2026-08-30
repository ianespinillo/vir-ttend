'use client';

import { useAuth } from '@/lib/auth/provider';
import { APP_ROUTES } from '@repo/common';
import { useSelectTenant } from '@repo/hooks';
import { TenantsPage } from '@repo/ui';
import { useRouter } from 'next/navigation';

export default function TenantsRoute() {
	const router = useRouter();
	const { user } = useAuth();
	const selectTenant = useSelectTenant();

	return (
		<TenantsPage
			onTenantClick={(tenant) => router.push(`${APP_ROUTES.tenants}/${tenant.id}`)}
			onEnter={(tenant) =>
				selectTenant.mutate(
					{ userId: user?.id ?? '', tenantId: tenant.id },
					{
						onSuccess: () => router.replace(`${APP_ROUTES.tenants}/${tenant.id}`),
					},
				)
			}
			enteringId={
				selectTenant.isPending ? (selectTenant.variables?.tenantId ?? null) : null
			}
		/>
	);
}
