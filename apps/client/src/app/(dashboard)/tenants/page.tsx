'use client';

import { APP_ROUTES } from '@repo/common';
import { TenantsPage } from '@repo/ui';
import { useRouter } from 'next/navigation';

export default function TenantsRoute() {
	const router = useRouter();
	return (
		<TenantsPage
			onTenantClick={(tenant) => router.push(`${APP_ROUTES.tenants}/${tenant.id}`)}
		/>
	);
}
