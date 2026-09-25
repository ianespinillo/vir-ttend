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
	UsersTable,
} from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

const ROLE_OPTIONS = [
	{ value: 'all', label: 'Todos los roles' },
	{ value: ROLES.ADMIN, label: 'Administrador' },
	{ value: ROLES.PRECEPTOR, label: 'Preceptor' },
	{ value: ROLES.TEACHER, label: 'Docente' },
	{ value: ROLES.SUPERADMIN, label: 'Superadmin' },
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

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full sm:w-64">
					<Input
						placeholder="Buscar por nombre o email…"
						value={search}
						onChange={(e) => handleSearchChange(e.target.value)}
					/>
				</div>
				<Select value={role} onValueChange={handleRoleChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Rol" />
					</SelectTrigger>
					<SelectContent>
						{ROLE_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<UsersTable
				users={usersData.items}
				showTenant={isSuperAdmin}
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
		</div>
	);
}
