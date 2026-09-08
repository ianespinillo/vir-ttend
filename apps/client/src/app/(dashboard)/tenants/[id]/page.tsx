'use client';

import { useAuth } from '@/lib/auth/provider';
import { APP_ROUTES } from '@repo/common';
import {
	useAddMembership,
	useRemoveMembership,
	useSelectTenant,
	useTenant,
	useTenantUsers,
} from '@repo/hooks';
import {
	AddMembershipModal,
	ErrorState,
	LoadingSpinner,
	PageHeader,
	TenantUsersTable,
} from '@repo/ui';
import { Button } from '@repo/ui';
import { useParams, useRouter } from 'next/navigation';

export default function TenantDetailRoute() {
	const params = useParams();
	const id = params.id as string;
	const router = useRouter();
	const { user, setUser } = useAuth();

	const {
		data: tenant,
		isLoading: tenantLoading,
		error: tenantError,
	} = useTenant(id);
	const { data: users, isLoading: usersLoading } = useTenantUsers(id);
	const selectTenant = useSelectTenant();
	const removeMembership = useRemoveMembership();
	const addMembership = useAddMembership();

	if (tenantLoading || usersLoading) return <LoadingSpinner />;
	if (tenantError) return <ErrorState description={tenantError.message} />;
	if (!tenant) return null;

	return (
		<div className="space-y-6">
			<PageHeader
				title={tenant.name}
				description={tenant.subdomain}
				actions={
					<Button
						onClick={() =>
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
						disabled={selectTenant.isPending}
					>
						Ingresar como Administrador
					</Button>
				}
			/>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Usuarios</h2>
					<AddMembershipModal
						tenantId={id}
						onSubmit={(data) => addMembership.mutate({ tenantId: id, data })}
					/>
				</div>

				{users && users.length > 0 ? (
					<TenantUsersTable
						users={users}
						onRemove={(user) =>
							removeMembership.mutate({
								email: user.email,
								tenantId: id,
							})
						}
					/>
				) : (
					<p className="text-sm text-muted-foreground">
						No hay usuarios en esta institución
					</p>
				)}
			</div>
		</div>
	);
}
