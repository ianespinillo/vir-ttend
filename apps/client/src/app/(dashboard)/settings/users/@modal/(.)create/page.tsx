'use client';

import type { CreateUserPayload } from '@repo/common';
import { useCreateUser } from '@repo/hooks';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	UserForm,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateUserInterceptedModal() {
	const router = useRouter();
	const [open, setOpen] = useState(true);
	const createUser = useCreateUser();

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			router.back();
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Crear Usuario</DialogTitle>
				</DialogHeader>
				<UserForm
					mode="create"
					onSubmit={(formData) => {
						createUser.mutate(formData as CreateUserPayload, {
							onSuccess: () => {
								toast.success('Usuario creado correctamente');
								handleOpenChange(false);
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
	);
}
