'use client';

import { useDemo } from '@/lib/session/demo-provider';
import { type CreateTenantPayload, ROLES, type Tenant } from '@repo/common';
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	EmptyState,
	ForbiddenState,
	Input,
	PageHeader,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	TenantForm,
	TenantStatusBadge,
} from '@repo/ui';
import { useMemo, useState } from 'react';

export default function TenantsManagementPage() {
	const { state, session, selectors, store } = useDemo();
	const currentUser = session.user;
	const isSuperAdmin = currentUser?.role === ROLES.SUPERADMIN;

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');

	const tenants = selectors.getTenants(state);
	const currentTenantId = session.tenant?.id;

	const filteredTenants = useMemo(() => {
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

	if (!isSuperAdmin) {
		return (
			<ForbiddenState
				title="Acceso restringido"
				description="Solo el usuario Superadmin tiene acceso a la gestión de instituciones (tenants)."
			/>
		);
	}

	const handleCreateTenant = (data: CreateTenantPayload) => {
		store.createTenant(data);
		setIsCreateOpen(false);
	};

	const handleToggleStatus = (tenant: Tenant) => {
		store.toggleTenantStatus(tenant.id, !tenant.isActive);
	};

	const handleEnterTenant = (tenant: Tenant) => {
		if (currentUser) {
			store.setSession(currentUser.id, tenant.id);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Instituciones"
				description="Gestión global de instituciones educativas del sistema"
				actions={
					<Button onClick={() => setIsCreateOpen(true)}>Nueva institución</Button>
				}
			/>

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full sm:w-64">
					<Input
						placeholder="Buscar institución…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Estado" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos los estados</SelectItem>
						<SelectItem value="active">Activas</SelectItem>
						<SelectItem value="inactive">Inactivas</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{filteredTenants.length === 0 ? (
				<EmptyState
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
								<div className="space-y-1">
									<div className="flex items-center justify-between">
										<h3 className="font-medium">{tenant.name}</h3>
										<TenantStatusBadge isActive={tenant.isActive} />
									</div>
									<p className="mt-1 text-sm text-muted-foreground">
										Subdominio: {tenant.subdomain}
									</p>
									<p className="text-sm text-muted-foreground">
										Contacto: {tenant.contactEmail}
									</p>
								</div>
								<div className="flex gap-2 pt-4">
									<Button
										variant={isCurrent ? 'secondary' : 'outline'}
										size="sm"
										disabled={isCurrent}
										onClick={() => handleEnterTenant(tenant)}
									>
										{isCurrent ? 'Activa' : 'Ingresar'}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleToggleStatus(tenant)}
									>
										{tenant.isActive ? 'Desactivar' : 'Activar'}
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Nueva Institución</DialogTitle>
					</DialogHeader>
					<TenantForm
						mode="create"
						onSubmit={(d) => handleCreateTenant(d as CreateTenantPayload)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
