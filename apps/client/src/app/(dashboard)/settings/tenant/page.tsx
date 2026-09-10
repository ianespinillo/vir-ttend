'use client';

import { useAuth } from '@/lib/auth/provider';
import { useTenant, useUpdateTenant } from '@repo/hooks';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ErrorState,
	LoadingSpinner,
	PageHeader,
	TenantForm,
} from '@repo/ui';
import { toast } from 'sonner';

export default function SettingsTenantRoute() {
	const { user } = useAuth();
	const tenantId = user?.tenantId ?? '';

	const { data: tenant, isLoading, error } = useTenant(tenantId);
	const updateTenant = useUpdateTenant();

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorState description={error.message} />;
	if (!tenant) return null;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Configuración de la Institución"
				description="Datos generales de tu institución"
			/>

			<div className="mx-auto max-w-2xl">
				<Card>
					<CardHeader>
						<CardTitle>Datos de la institución</CardTitle>
						<CardDescription>
							Actualizá el nombre y el email de contacto de tu institución.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<TenantForm
							mode="edit"
							initial={{
								name: tenant.name,
								contactEmail: tenant.contactEmail,
							}}
							onSubmit={(data) => {
								updateTenant.mutate(
									{ id: tenantId, data },
									{
										onSuccess: () => {
											toast.success('Institución actualizada correctamente');
										},
										onError: (err) => {
											toast.error(err.message ?? 'Error al actualizar la institución');
										},
									},
								);
							}}
							isLoading={updateTenant.isPending}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
