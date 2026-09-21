'use client';

import type { CreateTenantPayload, Tenant } from '@repo/common';
import {
	useCreateTenant,
	useTenants,
	useToggleTenantStatus,
} from '@repo/hooks';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { Input } from '../../../ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { PageHeader } from '../../shared/page-header';
import { TenantForm } from './tenant-form';
import { TenantStatusBadge } from './tenant-status-badge';

export interface TenantsPageProps {
	currentTenantId?: string | null;
	onTenantClick?: (tenant: Tenant) => void;
	onEnter?: (tenant: Tenant) => void;
	enteringId?: string | null;
}

export function TenantsPage({
	currentTenantId,
	onTenantClick,
	onEnter,
	enteringId,
}: Readonly<TenantsPageProps>) {
	const { data: tenants, isLoading, error } = useTenants();
	const createTenant = useCreateTenant();
	const toggleStatus = useToggleTenantStatus();
	const [createOpen, setCreateOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');

	const filteredTenants = useMemo(() => {
		if (!tenants) return [];
		return tenants.filter((tenant) => {
			const query = search.trim().toLowerCase();
			const matchesSearch =
				query === '' ||
				tenant.name.toLowerCase().includes(query) ||
				tenant.subdomain.toLowerCase().includes(query) ||
				tenant.contactEmail.toLowerCase().includes(query);

			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'active' && tenant.isActive) ||
				(statusFilter === 'inactive' && !tenant.isActive);

			return matchesSearch && matchesStatus;
		});
	}, [tenants, search, statusFilter]);

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
				<>
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar por nombre, subdominio o email..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>

						<div className="flex items-center gap-2">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="Estado" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos los estados</SelectItem>
									<SelectItem value="active">Activas</SelectItem>
									<SelectItem value="inactive">Inactivas</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{filteredTenants.length === 0 ? (
						<EmptyState
							icon="Building2"
							title="No se encontraron instituciones"
							description="No hay instituciones que coincidan con los filtros aplicados."
						/>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{filteredTenants.map((tenant) => {
								const isCurrent = currentTenantId === tenant.id;
								return (
									<div
										key={tenant.id}
										className={`flex flex-col justify-between rounded-lg border p-4 text-left transition-colors ${
											isCurrent
												? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
												: 'hover:bg-muted/40'
										}`}
									>
										<div
											className={onTenantClick ? 'cursor-pointer space-y-1' : 'space-y-1'}
											onClick={() => onTenantClick?.(tenant)}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													onTenantClick?.(tenant);
												}
											}}
											tabIndex={onTenantClick ? 0 : undefined}
											role={onTenantClick ? 'button' : undefined}
										>
											<div className="flex items-center justify-between">
												<h3 className="font-medium">{tenant.name}</h3>
												<TenantStatusBadge isActive={tenant.isActive} />
											</div>
											<p className="mt-1 text-sm text-muted-foreground">
												{tenant.subdomain}
											</p>
											<p className="text-sm text-muted-foreground">
												{tenant.contactEmail}
											</p>
										</div>
										<div className="flex gap-2 pt-4">
											{onEnter && (
												<Button
													variant={isCurrent ? 'secondary' : 'outline'}
													size="sm"
													disabled={enteringId === tenant.id || isCurrent}
													onClick={() => onEnter(tenant)}
												>
													{isCurrent
														? 'Activo'
														: enteringId === tenant.id
															? 'Ingresando…'
															: 'Ingresar'}
												</Button>
											)}
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													toggleStatus.mutate({
														id: tenant.id,
														isActive: !tenant.isActive,
													});
												}}
											>
												{tenant.isActive ? 'Desactivar' : 'Activar'}
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</>
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
