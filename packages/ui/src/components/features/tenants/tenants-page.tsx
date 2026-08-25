'use client';

import type { CreateTenantPayload, Tenant } from '@repo/common';
import {
	useCreateTenant,
	useTenants,
	useToggleTenantStatus,
} from '@repo/hooks';
import { useState } from 'react';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { PageHeader } from '../../shared/page-header';
import { TenantForm } from './tenant-form';
import { TenantStatusBadge } from './tenant-status-badge';

export interface TenantsPageProps {
	onTenantClick?: (tenant: Tenant) => void;
}

export function TenantsPage({ onTenantClick }: Readonly<TenantsPageProps>) {
	const { data: tenants, isLoading, error } = useTenants();
	const createTenant = useCreateTenant();
	const toggleStatus = useToggleTenantStatus();
	const [createOpen, setCreateOpen] = useState(false);

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorState description={error.message} />;
	if (!tenants) return null;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Instituciones"
				description="Gestión de instituciones del sistema"
				actions={
					<Button onClick={() => setCreateOpen(true)}>Crear Institución</Button>
				}
			/>

			{tenants.length === 0 ? (
				<EmptyState
					icon="Building2"
					title="Sin instituciones"
					description="Creá la primera institución para comenzar"
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{tenants.map((tenant) => (
						<button
							type="button"
							key={tenant.id}
							className="cursor-pointer rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
							onClick={() => onTenantClick?.(tenant)}
						>
							<div className="flex items-center justify-between">
								<h3 className="font-medium">{tenant.name}</h3>
								<TenantStatusBadge isActive={tenant.isActive} />
							</div>
							<p className="mt-1 text-sm text-muted-foreground">{tenant.subdomain}</p>
							<p className="text-sm text-muted-foreground">{tenant.contactEmail}</p>
							<div className="flex gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={(e) => {
										e.stopPropagation();
										toggleStatus.mutate({
											id: tenant.id,
											isActive: !tenant.isActive,
										});
									}}
								>
									{tenant.isActive ? 'Desactivar' : 'Activar'}
								</Button>
							</div>
						</button>
					))}
				</div>
			)}

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Crear Institución</DialogTitle>
					</DialogHeader>
					<TenantForm
						mode="create"
						onSubmit={(data) => {
							createTenant.mutate(data as CreateTenantPayload, {
								onSuccess: () => setCreateOpen(false),
							});
						}}
						isLoading={createTenant.isPending}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
