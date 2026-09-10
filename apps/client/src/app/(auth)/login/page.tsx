'use client';

import { useAuth } from '@/lib/auth/provider';
import { authPendingStore } from '@/stores/auth-store';
import type { LoginFormValues } from '@repo/common';
import { useLogin, useSelectTenant } from '@repo/hooks';
import { LoginForm } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
	const loginMutation = useLogin();
	const selectTenantMutation = useSelectTenant();
	const { setUser, refetchUser } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get('redirect') || '/dashboard';
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (values: LoginFormValues) => {
		setError(null);
		loginMutation.mutate(values, {
			onSuccess: async (data) => {
				if (data.isSuperAdmin) {
					// For superadmin: fetch the user and set it in context before navigating
					// to avoid race condition where dashboard layout sees user===null
					const result = await refetchUser();
					if (result.data) {
						setUser(result.data);
					}
					router.replace('/tenants');
					return;
				}

				if (data.tenants.length === 0) {
					setError('Tu usuario no tiene ninguna institución asignada.');
					return;
				}

				if (data.tenants.length === 1) {
					selectTenantMutation.mutate(
						{ userId: data.userId, tenantId: data.tenants[0].tenantId },
						{
							onSuccess: async () => {
								// useSelectTenant already sets user in query cache via setQueryData.
								// We still call refetchUser so the AuthProvider effect can sync the user state.
								const result = await refetchUser();
								if (result.data) {
									setUser(result.data);
								}
								router.replace(redirectUrl);
							},
							onError: (err) => {
								setError(err.message || 'Error al seleccionar la institución.');
							},
						},
					);
					return;
				}

				authPendingStore.set({
					userId: data.userId,
					tenants: data.tenants,
					isSuperAdmin: data.isSuperAdmin,
				});
				router.push('/select-tenant');
			},
			onError: (err) => {
				const message = err.response?.data?.message;
				setError(
					Array.isArray(message)
						? message.join(', ')
						: message || 'Credenciales inválidas. Verifica tu correo y contraseña.',
				);
			},
		});
	};

	const isLoading = loginMutation.isPending || selectTenantMutation.isPending;

	return (
		<LoginForm
			onSubmit={handleSubmit}
			isLoading={isLoading}
			errorMessage={error}
		/>
	);
}
