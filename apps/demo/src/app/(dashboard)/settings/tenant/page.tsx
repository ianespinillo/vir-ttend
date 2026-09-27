'use client';

import { useDemo } from '@/lib/session/demo-provider';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	EmptyState,
	PageHeader,
	TenantForm,
} from '@repo/ui';
import { toast } from 'sonner';

export default function SettingsTenantRoute() {
	const { session, store } = useDemo();
	const tenant = session.tenant;

	if (!tenant) {
		return (
			<EmptyState
				title="Institución no encontrada"
				description="No hay una institución asociada a la sesión actual."
			/>
		);
	}

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
								store.updateTenant(tenant.id, data);
								toast.success('Institución actualizada correctamente');
							}}
							isLoading={false}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
