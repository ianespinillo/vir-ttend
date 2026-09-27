'use client';

import { useDemo } from '@/lib/session/demo-provider';
import {
	type CreateUserInput,
	type IUserWithMembershipResponse,
	ROLES,
	type Roles,
	type UpdateUserInput,
} from '@repo/common';
import {
	Button,
	ChangeRoleDialog,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	PageHeader,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleUserStatusDialog,
	UserCredentialsDialog,
	UserForm,
	UserManagementSheet,
	UsersTable,
	cn,
} from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

const ROLE_FILTERS = [
	{
		value: 'all',
		label: 'Todos',
		activeClasses:
			'bg-slate-200 border-slate-400 text-slate-900 dark:bg-slate-700 dark:border-slate-500 dark:text-white ring-2 ring-slate-400/50 shadow-xs font-semibold',
		inactiveClasses:
			'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
	},
	{
		value: ROLES.SUPERADMIN,
		label: 'Superadmin',
		superAdminOnly: true,
		activeClasses:
			'bg-purple-200 border-purple-400 text-purple-950 dark:bg-purple-900/70 dark:border-purple-500 dark:text-purple-100 ring-2 ring-purple-400/50 shadow-xs font-semibold',
		inactiveClasses:
			'bg-purple-100 hover:bg-purple-200/80 border-purple-200 text-purple-950 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 dark:border-purple-800 dark:text-purple-200',
	},
	{
		value: ROLES.ADMIN,
		label: 'Administrador',
		activeClasses:
			'bg-sky-200 border-sky-400 text-sky-950 dark:bg-sky-900/70 dark:border-sky-500 dark:text-sky-100 ring-2 ring-sky-400/50 shadow-xs font-semibold',
		inactiveClasses:
			'bg-sky-100 hover:bg-sky-200/80 border-sky-200 text-sky-950 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 dark:border-sky-800 dark:text-sky-200',
	},
	{
		value: ROLES.PRECEPTOR,
		label: 'Preceptor',
		activeClasses:
			'bg-amber-200 border-amber-400 text-amber-950 dark:bg-amber-900/70 dark:border-amber-500 dark:text-amber-100 ring-2 ring-amber-400/50 shadow-xs font-semibold',
		inactiveClasses:
			'bg-amber-100 hover:bg-amber-200/80 border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 dark:border-amber-800 dark:text-amber-200',
	},
	{
		value: ROLES.TEACHER,
		label: 'Docente',
		activeClasses:
			'bg-emerald-200 border-emerald-400 text-emerald-950 dark:bg-emerald-900/70 dark:border-emerald-500 dark:text-emerald-100 ring-2 ring-emerald-400/50 shadow-xs font-semibold',
		inactiveClasses:
			'bg-emerald-100 hover:bg-emerald-200/80 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-200',
	},
];

export default function UsersManagementPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { state, session, selectors, store } = useDemo();

	const currentUser = session.user;
	const isSuperAdmin = currentUser?.role === ROLES.SUPERADMIN;

	const searchParam = searchParams.get('search') ?? '';
	const roleParam = searchParams.get('role') ?? 'all';
	const pageParam = Number.parseInt(searchParams.get('page') ?? '1', 10);
	const page = Number.isNaN(pageParam) ? 1 : pageParam;

	const [search, setSearch] = useState(searchParam);
	const [role, setRole] = useState(roleParam);

	const tenants = selectors.getTenants(state);

	const usersData = selectors.getUsers(state, {
		search: search.trim() || undefined,
		role: role === 'all' ? undefined : (role as Roles),
		tenantId: isSuperAdmin ? undefined : (currentUser?.tenantId ?? undefined),
		page,
		limit: 10,
	});

	// Dialog states
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingUser, setEditingUser] =
		useState<IUserWithMembershipResponse | null>(null);
	const [roleUser, setRoleUser] = useState<IUserWithMembershipResponse | null>(
		null,
	);
	const [statusUser, setStatusUser] = useState<{
		user: IUserWithMembershipResponse;
		targetStatus: boolean;
	} | null>(null);
	const [credentials, setCredentials] = useState<{
		firstName: string;
		lastName: string;
		email: string;
		role: string;
		temporaryPassword?: string;
		tenantName?: string;
	} | null>(null);
	const [selectedUser, setSelectedUser] =
		useState<IUserWithMembershipResponse | null>(null);

	const updateQueryParams = useCallback(
		(newParams: Record<string, string | number | undefined>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, val] of Object.entries(newParams)) {
				if (val === undefined || val === '' || val === 'all') {
					params.delete(key);
				} else {
					params.set(key, String(val));
				}
			}
			router.push(`${pathname}?${params.toString()}`);
		},
		[pathname, router, searchParams],
	);

	const handleSearchChange = (val: string) => {
		setSearch(val);
		updateQueryParams({ search: val, page: 1 });
	};

	const handleRoleChange = (val: string) => {
		setRole(val);
		updateQueryParams({ role: val, page: 1 });
	};

	const handleCreateSubmit = (data: CreateUserInput | UpdateUserInput) => {
		const createData = data as CreateUserInput;
		const tenant = tenants.find((t) => t.id === createData.tenantId);
		const result = store.createUser({
			firstName: createData.firstName,
			lastName: createData.lastName,
			email: createData.email,
			role: createData.role,
			tenantId: createData.tenantId,
		});
		setIsCreateOpen(false);
		setCredentials({
			firstName: result.firstName,
			lastName: result.lastName,
			email: result.email,
			role: result.role,
			temporaryPassword: result.temporaryPassword,
			tenantName: tenant?.name,
		});
	};

	const handleEditSubmit = (data: CreateUserInput | UpdateUserInput) => {
		if (!editingUser) return;
		store.updateUser(editingUser.id, {
			firstName: data.firstName,
			lastName: data.lastName,
		});
		setEditingUser(null);
	};

	const handleChangeRole = (userId: string, newRole: Roles) => {
		store.changeRole(userId, newRole);
		setRoleUser(null);
	};

	const handleToggleStatus = (userId: string, targetStatus: boolean) => {
		store.toggleUserStatus(userId, targetStatus);
		setStatusUser(null);
	};

	const handleResetPassword = (user: IUserWithMembershipResponse) => {
		const result = store.resetPassword(user.id);
		const tenant = tenants.find((t) => t.id === user.tenantId);
		setCredentials({
			firstName: result.firstName,
			lastName: result.lastName,
			email: result.email,
			role: result.role,
			temporaryPassword: result.temporaryPassword,
			tenantName: tenant?.name,
		});
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Usuarios"
				description="Gestión de usuarios y accesos"
				actions={
					<Button onClick={() => setIsCreateOpen(true)}>Nuevo usuario</Button>
				}
			/>

			<div className="space-y-3">
				<div className="flex flex-wrap items-center gap-3">
					<div className="w-full sm:w-80">
						<Input
							placeholder="Buscar por nombre, apellido o email…"
							value={search}
							onChange={(e) => handleSearchChange(e.target.value)}
						/>
					</div>
				</div>

				{/* Filtro de Roles como Chips / Etiquetas con Colores Pasteles */}
				<div className="flex flex-wrap items-center gap-2">
					{ROLE_FILTERS.map((chip) => {
						if (chip.superAdminOnly && !isSuperAdmin) return null;
						const isSelected = role === chip.value;
						return (
							<button
								key={chip.value}
								type="button"
								onClick={() =>
									handleRoleChange(
										isSelected && chip.value !== 'all' ? 'all' : chip.value,
									)
								}
								className={cn(
									'inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer select-none',
									isSelected ? chip.activeClasses : chip.inactiveClasses,
								)}
							>
								{chip.label}
							</button>
						);
					})}
				</div>
			</div>

			<UsersTable
				users={usersData.items}
				showTenant={isSuperAdmin}
				onUserClick={(u) => setSelectedUser(u)}
				onEdit={(u) => setEditingUser(u)}
				onChangeRole={(u) => setRoleUser(u)}
				onToggleStatus={(u, targetStatus) =>
					setStatusUser({ user: u, targetStatus })
				}
				onResetPassword={handleResetPassword}
				pagination={{
					page: usersData.page,
					totalPages: usersData.totalPages,
					total: usersData.total,
					limit: 10,
					onPageChange: (p) => updateQueryParams({ page: p }),
				}}
			/>

			{/* Create User Dialog */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Nuevo Usuario</DialogTitle>
					</DialogHeader>
					<UserForm
						mode="create"
						isSuperAdmin={isSuperAdmin}
						tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
						selectedTenantId={currentUser?.tenantId ?? undefined}
						onSubmit={handleCreateSubmit}
						onCancel={() => setIsCreateOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Edit User Dialog */}
			<Dialog
				open={Boolean(editingUser)}
				onOpenChange={(open) => !open && setEditingUser(null)}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Editar Usuario</DialogTitle>
					</DialogHeader>
					{editingUser && (
						<UserForm
							mode="edit"
							initial={{
								firstName: editingUser.firstName,
								lastName: editingUser.lastName,
								email: editingUser.email,
								role: editingUser.role,
								tenantId: editingUser.tenantId ?? undefined,
							}}
							onSubmit={handleEditSubmit}
							onCancel={() => setEditingUser(null)}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Change Role Dialog */}
			<ChangeRoleDialog
				open={Boolean(roleUser)}
				onOpenChange={(open) => !open && setRoleUser(null)}
				user={roleUser}
				isSuperAdmin={isSuperAdmin}
				onConfirm={handleChangeRole}
			/>

			{/* Toggle User Status Dialog */}
			<ToggleUserStatusDialog
				open={Boolean(statusUser)}
				onOpenChange={(open) => !open && setStatusUser(null)}
				user={statusUser?.user ?? null}
				targetStatus={statusUser?.targetStatus ?? false}
				onConfirm={handleToggleStatus}
			/>

			{/* Credentials Dialog */}
			<UserCredentialsDialog
				open={Boolean(credentials)}
				onOpenChange={(open) => !open && setCredentials(null)}
				credentials={credentials}
			/>

			{/* Panel de Gestión del Usuario (Lateral Derecho) */}
			<UserManagementSheet
				user={selectedUser}
				open={Boolean(selectedUser)}
				onOpenChange={(open) => !open && setSelectedUser(null)}
				isSuperAdmin={isSuperAdmin}
				onShowCredentials={(user) => {
					setSelectedUser(null);
					handleResetPassword(user);
				}}
				onEdit={(user) => {
					setSelectedUser(null);
					setEditingUser(user);
				}}
				onChangeRole={(user) => {
					setSelectedUser(null);
					setRoleUser(user);
				}}
				onToggleStatus={(user, targetStatus) => {
					setSelectedUser(null);
					setStatusUser({ user, targetStatus });
				}}
			/>
		</div>
	);
}
