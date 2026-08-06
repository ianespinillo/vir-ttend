'use client';

import { useAuth } from '@/lib/auth/provider';
import { authPendingStore } from '@/stores/auth-store';
import { useSelectTenant } from '@repo/hooks';
import { TenantSelector } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SelectTenantPage() {
	const selectTenantMutation = useSelectTenant();
	const { refetchUser } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get('redirect') || '/dashboard';

	const [pending, setPending] = useState(authPendingStore.get());
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const current = authPendingStore.get();
		setPending(current);
		if (!current.userId || current.tenants.length === 0) {
			router.replace('/login');
		}
	}, [router]);

	const handleSelect = (tenantId: string) => {
		if (!pending.userId) {
			router.replace('/login');
			return;
		}

		setError(null);
		selectTenantMutation.mutate(
			{ userId: pending.userId, tenantId },
			{
				onSuccess: async () => {
					authPendingStore.clear();
					await refetchUser();
					router.replace(redirectUrl);
				},
				onError: (err) => {
					const message = err.response?.data?.message;
					setError(
						Array.isArray(message)
							? message.join(', ')
							: message || 'Error al seleccionar la institución. Intenta nuevamente.',
					);
				},
			},
		);
	};

	if (!pending.userId || pending.tenants.length === 0) {
		return null;
	}

	return (
		<TenantSelector
			tenants={pending.tenants}
			onSelect={handleSelect}
			isLoading={selectTenantMutation.isPending}
			errorMessage={error}
		/>
	);
}
