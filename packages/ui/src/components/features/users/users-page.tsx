'use client';

import type {
	CreateUserPayload,
	IUserWithMembershipResponse,
	Roles,
	UpdateUserPayload,
} from '@repo/common';
import {
	useChangeRole,
	useCreateUser,
	useDeactivateMembership,
	useUpdateUser,
	useUsers,
} from '@repo/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { ChangeRoleDialog } from './change-role-dialog';
import { DeactivateUserDialog } from './deactivate-user-dialog';
import { UserForm } from './user-form';
import { UsersTable } from './users-table';

export function UsersPage() {
	const { data, isLoading, error } = useUsers();
	const createUser = useCreateUser();
	const updateUser = useUpdateUser();
	const changeRole = useChangeRole();
	const deactivateMembership = useDeactivateMembership();

	// Dialog states
	const [createOpen, setCreateOpen] = useState(false);
	const [editTarget, setEditTarget] =
		useState<IUserWithMembershipResponse | null>(null);
	const [changeRoleTarget, setChangeRoleTarget] =
		useState<IUserWithMembershipResponse | null>(null);
	const [deactivateTarget, setDeactivateTarget] =
		useState<IUserWithMembershipResponse | null>(null);

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorState description={error.message} />;

	const users = data?.items ?? [];

	function handleEdit(user: IUserWithMembershipResponse) {
		setEditTarget(user);
	}

	function handleChangeRole(user: IUserWithMembershipResponse) {
		setChangeRoleTarget(user);
	}

	function handleDeactivate(user: IUserWithMembershipResponse) {
		setDeactivateTarget(user);
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

	function handleConfirmDeactivate(userId: string) {
		deactivateMembership.mutate(userId, {
			onSuccess: () => {
				setDeactivateTarget(null);
				toast.success('Membresía desactivada');
			},
			onError: (err) => {
				toast.error(err.message ?? 'Error al desactivar el usuario');
			},
		});
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Usuarios"
				description="Gestión de usuarios del tenant"
				actions={<Button onClick={() => setCreateOpen(true)}>Crear Usuario</Button>}
			/>

			{users.length === 0 ? (
				<EmptyState
					icon="Users"
					title="Sin usuarios"
					description="Creá el primer usuario para comenzar"
				/>
			) : (
				<UsersTable
					users={users}
					onEdit={handleEdit}
					onDeactivate={handleDeactivate}
					onChangeRole={handleChangeRole}
				/>
			)}

			{/* Crear usuario */}
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Crear Usuario</DialogTitle>
					</DialogHeader>
					<UserForm
						mode="create"
						onSubmit={(formData) => {
							createUser.mutate(formData as CreateUserPayload, {
								onSuccess: () => {
									setCreateOpen(false);
									toast.success('Usuario creado correctamente');
								},
								onError: (err) => {
									const message =
										err.message?.includes('409') || err.message?.includes('duplicate')
											? 'Ya existe un usuario con ese email'
											: (err.message ?? 'Error al crear el usuario');
									toast.error(message);
								},
							});
						}}
						isLoading={createUser.isPending}
					/>
				</DialogContent>
			</Dialog>

			{/* Editar usuario */}
			<Dialog
				open={Boolean(editTarget)}
				onOpenChange={(open) => !open && setEditTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Usuario</DialogTitle>
					</DialogHeader>
					{editTarget && (
						<UserForm
							mode="edit"
							initial={{
								firstName: editTarget.firstName,
								lastName: editTarget.lastName,
							}}
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
				open={Boolean(changeRoleTarget)}
				onOpenChange={(open) => !open && setChangeRoleTarget(null)}
				onConfirm={handleConfirmChangeRole}
				isLoading={changeRole.isPending}
			/>

			{/* Desactivar usuario */}
			<DeactivateUserDialog
				user={deactivateTarget}
				open={Boolean(deactivateTarget)}
				onOpenChange={(open) => !open && setDeactivateTarget(null)}
				onConfirm={handleConfirmDeactivate}
				isLoading={deactivateMembership.isPending}
			/>
		</div>
	);
}
