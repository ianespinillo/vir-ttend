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
import { UsersTable } from './users-table';

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

				<div className="flex items-center gap-2">
					<Select
						value={role}
						onValueChange={(val) => {
							setRole(val);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-[160px]">
							<SelectValue placeholder="Rol" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos los roles</SelectItem>
							<SelectItem value={ROLES.ADMIN}>Administrador</SelectItem>
							<SelectItem value={ROLES.PRECEPTOR}>Preceptor</SelectItem>
							<SelectItem value={ROLES.TEACHER}>Docente</SelectItem>
							{isSuperAdmin && (
								<SelectItem value={ROLES.SUPERADMIN}>Superadmin</SelectItem>
							)}
						</SelectContent>
					</Select>

					{isSuperAdmin && tenants && tenants.length > 0 && (
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
					)}
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
						onUserClick={onUserClick}
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
		</div>
	);
}
