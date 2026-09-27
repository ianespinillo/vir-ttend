'use client';

import {
	type CreateUserPayload,
	type IUserWithMembershipResponse,
	ROLES,
	type Roles,
	type UpdateUserPayload,
} from '@repo/common';
import {
	useChangeRole,
	useCreateUser,
	useResetUserPassword,
	useTenants,
	useToggleUserStatus,
	useUpdateUser,
	useUsers,
} from '@repo/hooks';
import { Building2, Filter, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
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
import { ChangeRoleDialog } from './change-role-dialog';
import { ToggleUserStatusDialog } from './toggle-user-status-dialog';
import { UserCredentialsDialog } from './user-credentials-dialog';
import { UserForm } from './user-form';
import { UserManagementSheet } from './user-management-sheet';
import { UsersTable } from './users-table';

interface RoleFilterOption {
	value: string;
	label: string;
	superAdminOnly?: boolean;
	activeClasses: string;
	inactiveClasses: string;
}

const ROLE_FILTERS: RoleFilterOption[] = [
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

export interface UsersPageProps {
	isSuperAdmin?: boolean;
	onCreateUser?: () => void;
	onUserClick?: (user: IUserWithMembershipResponse) => void;
}

export function UsersPage({
	isSuperAdmin,
	onCreateUser,
	onUserClick,
}: Readonly<UsersPageProps>) {
	const [search, setSearch] = useState('');
	const [role, setRole] = useState<string>('all');
	const [tenantId, setTenantId] = useState<string>('all');
	const [page, setPage] = useState(1);

	const { data: tenants } = useTenants({ enabled: isSuperAdmin });

	const { data, isLoading, error } = useUsers({
		search: search.trim() || undefined,
		role: role === 'all' ? undefined : (role as Roles),
		tenantId: isSuperAdmin
			? tenantId === 'all'
				? undefined
				: tenantId
			: undefined,
		page,
		limit: 15,
	});

	const createUser = useCreateUser();
	const updateUser = useUpdateUser();
	const changeRole = useChangeRole();
	const toggleStatus = useToggleUserStatus();
	const resetPassword = useResetUserPassword();

	// Dialog states
	const [createOpen, setCreateOpen] = useState(false);
	const [editTarget, setEditTarget] =
		useState<IUserWithMembershipResponse | null>(null);
	const [changeRoleTarget, setChangeRoleTarget] =
		useState<IUserWithMembershipResponse | null>(null);
	const [statusTarget, setStatusTarget] = useState<{
		user: IUserWithMembershipResponse;
		targetStatus: boolean;
	} | null>(null);
	const [credentialsTarget, setCredentialsTarget] = useState<{
		firstName: string;
		lastName: string;
		email: string;
		role: string;
		temporaryPassword?: string;
		tenantName?: string;
	} | null>(null);
	const [sheetUser, setSheetUser] = useState<IUserWithMembershipResponse | null>(
		null,
	);

	const users = data?.items ?? [];

	function handleEdit(user: IUserWithMembershipResponse) {
		setEditTarget(user);
	}

	function handleChangeRole(user: IUserWithMembershipResponse) {
		setChangeRoleTarget(user);
	}

	function handleToggleStatus(
		user: IUserWithMembershipResponse,
		targetStatus: boolean,
	) {
		setStatusTarget({ user, targetStatus });
	}

	function handleConfirmChangeRole(userId: string, newRole: Roles) {
		changeRole.mutate(
			{ userId, newRole },
			{
				onSuccess: () => {
					setChangeRoleTarget(null);
					toast.success('Rol actualizado correctamente');
				},
				onError: (err) => {
					toast.error(err.message ?? 'Error al cambiar el rol');
				},
			},
		);
	}

	function handleConfirmToggleStatus(userId: string, targetStatus: boolean) {
		toggleStatus.mutate(
			{
				userId,
				isActive: targetStatus,
				tenantId: statusTarget?.user.tenantId,
			},
			{
				onSuccess: () => {
					setStatusTarget(null);
					toast.success(
						targetStatus
							? 'Usuario reactivado correctamente'
							: 'Usuario desactivado correctamente',
					);
				},
				onError: (err: Error) => {
					toast.error(err.message ?? 'Error al actualizar el estado del usuario');
				},
			},
		);
	}

	function handleResetPassword(user: IUserWithMembershipResponse) {
		resetPassword.mutate(
			{ userId: user.id, tenantId: user.tenantId },
			{
				onSuccess: (res) => {
					setCredentialsTarget({
						firstName: res.firstName,
						lastName: res.lastName,
						email: res.email,
						role: user.role,
						temporaryPassword: res.temporaryPassword,
						tenantName: user.tenantName,
					});
					toast.success('Contraseña restablecida correctamente');
				},
				onError: (err) => {
					toast.error(err.message ?? 'Error al restablecer la contraseña');
				},
			},
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Usuarios"
				description={
					isSuperAdmin
						? 'Directorio global de usuarios y membresías de la plataforma'
						: 'Gestión de usuarios y accesos de la institución'
				}
				actions={
					<Button onClick={onCreateUser ?? (() => setCreateOpen(true))}>
						Crear Usuario
					</Button>
				}
			/>

			{/* Barra de Filtros y Búsqueda */}
			<div className="space-y-3">
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por nombre, apellido o email..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="pl-9"
						/>
					</div>

					{isSuperAdmin && tenants && tenants.length > 0 && (
						<div className="flex items-center gap-2">
							<Select
								value={tenantId}
								onValueChange={(val) => {
									setTenantId(val);
									setPage(1);
								}}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Institución" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todas las instituciones</SelectItem>
									{tenants.map((t) => (
										<SelectItem key={t.id} value={t.id}>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
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
								onClick={() => {
									setRole(isSelected && chip.value !== 'all' ? 'all' : chip.value);
									setPage(1);
								}}
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

			{isLoading && <LoadingSpinner />}
			{error && <ErrorState description={error.message} />}

			{!isLoading &&
				!error &&
				(users.length === 0 ? (
					<EmptyState
						icon="Users"
						title="Sin usuarios"
						description={
							search || role !== 'all' || tenantId !== 'all'
								? 'No se encontraron usuarios que coincidan con los filtros aplicados.'
								: 'Creá el primer usuario para comenzar.'
						}
					/>
				) : (
					<UsersTable
						users={users}
						showTenant={isSuperAdmin && (!tenantId || tenantId === 'all')}
						onUserClick={(user) => {
							setSheetUser(user);
							onUserClick?.(user);
						}}
						onEdit={handleEdit}
						onToggleStatus={handleToggleStatus}
						onChangeRole={handleChangeRole}
						onResetPassword={handleResetPassword}
						pagination={{
							page,
							limit: 15,
							total: data?.total ?? 0,
							totalPages: data?.totalPages ?? 1,
							onPageChange: setPage,
						}}
					/>
				))}

			{/* Modal Crear usuario */}
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Crear Usuario</DialogTitle>
					</DialogHeader>
					<UserForm
						mode="create"
						isSuperAdmin={isSuperAdmin}
						tenants={tenants ?? []}
						selectedTenantId={tenantId !== 'all' ? tenantId : undefined}
						onCancel={() => setCreateOpen(false)}
						onSubmit={(formData) => {
							createUser.mutate(formData as CreateUserPayload, {
								onSuccess: (created) => {
									setCreateOpen(false);
									setCredentialsTarget({
										firstName: created.firstName,
										lastName: created.lastName,
										email: created.email,
										role: created.role,
										temporaryPassword: created.temporaryPassword,
										tenantName: tenants?.find((t) => t.id === created.tenantId)?.name,
									});
									toast.success('Usuario registrado exitosamente');
								},
								onError: (err) => {
									const message =
										err.message?.includes('409') ||
										err.message?.includes('duplicate') ||
										err.message?.includes('belongs to tenant')
											? 'El usuario ya pertenece a esta institución'
											: (err.message ?? 'Error al crear el usuario');
									toast.error(message);
								},
							});
						}}
						isLoading={createUser.isPending}
					/>
				</DialogContent>
			</Dialog>

			{/* Modal Editar usuario */}
			<Dialog
				open={Boolean(editTarget)}
				onOpenChange={(open) => !open && setEditTarget(null)}
			>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Editar Usuario</DialogTitle>
					</DialogHeader>
					{editTarget && (
						<UserForm
							mode="edit"
							isSuperAdmin={isSuperAdmin}
							initial={{
								firstName: editTarget.firstName,
								lastName: editTarget.lastName,
								email: editTarget.email,
								role: editTarget.role,
								tenantId: editTarget.tenantId,
								tenantName: editTarget.tenantName,
							}}
							onCancel={() => setEditTarget(null)}
							onSubmit={(formData) => {
								updateUser.mutate(
									{
										id: editTarget.id,
										data: formData as UpdateUserPayload,
									},
									{
										onSuccess: () => {
											setEditTarget(null);
											toast.success('Usuario actualizado');
										},
										onError: (err) => {
											toast.error(err.message ?? 'Error al actualizar el usuario');
										},
									},
								);
							}}
							isLoading={updateUser.isPending}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Cambiar rol */}
			<ChangeRoleDialog
				user={changeRoleTarget}
				isSuperAdmin={isSuperAdmin}
				open={Boolean(changeRoleTarget)}
				onOpenChange={(open) => !open && setChangeRoleTarget(null)}
				onConfirm={handleConfirmChangeRole}
				isLoading={changeRole.isPending}
			/>

			{/* Activar / Desactivar usuario */}
			<ToggleUserStatusDialog
				user={statusTarget?.user ?? null}
				targetStatus={statusTarget?.targetStatus ?? false}
				open={Boolean(statusTarget)}
				onOpenChange={(open) => !open && setStatusTarget(null)}
				onConfirm={handleConfirmToggleStatus}
				isLoading={toggleStatus.isPending}
			/>

			{/* Modal de credenciales generadas */}
			<UserCredentialsDialog
				open={Boolean(credentialsTarget)}
				onOpenChange={(open) => !open && setCredentialsTarget(null)}
				credentials={credentialsTarget}
			/>

			{/* Panel de Gestión del Usuario (Lateral Derecho) */}
			<UserManagementSheet
				user={sheetUser}
				open={Boolean(sheetUser)}
				onOpenChange={(open) => !open && setSheetUser(null)}
				isSuperAdmin={isSuperAdmin}
				onShowCredentials={(user) => {
					setSheetUser(null);
					handleResetPassword(user);
				}}
				onEdit={(user) => {
					setSheetUser(null);
					handleEdit(user);
				}}
				onChangeRole={(user) => {
					setSheetUser(null);
					handleChangeRole(user);
				}}
				onToggleStatus={(user, targetStatus) => {
					setSheetUser(null);
					handleToggleStatus(user, targetStatus);
				}}
			/>
		</div>
	);
}
