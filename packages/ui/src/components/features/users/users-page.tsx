'use client';

import type { CreateUserInput } from '@repo/common';
import { useCreateUser, useUsers } from '@repo/hooks';
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
import { UserForm } from './user-form';
import { UsersTable } from './users-table';

export function UsersPage() {
	const { data, isLoading, error } = useUsers();
	const createUser = useCreateUser();
	const [createOpen, setCreateOpen] = useState(false);

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorState description={error.message} />;

	const users = data?.items ?? [];

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
				<UsersTable users={users} />
			)}

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Crear Usuario</DialogTitle>
					</DialogHeader>
					<UserForm
						mode="create"
						onSubmit={(data) => {
							createUser.mutate(data as CreateUserInput, {
								onSuccess: () => setCreateOpen(false),
							});
						}}
						isLoading={createUser.isPending}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
