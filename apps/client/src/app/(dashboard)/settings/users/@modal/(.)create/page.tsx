'use client';

import { type CreateUserPayload, ROLES } from '@repo/common';
import { useCreateUser, useCurrentUser, useTenants } from '@repo/hooks';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	UserCredentialsDialog,
	UserForm,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateUserInterceptedModal() {
	const router = useRouter();
	const [open, setOpen] = useState(true);
	const { data: currentUser } = useCurrentUser();
	const isSuperAdmin = currentUser?.role === ROLES.SUPERADMIN;
	const { data: tenants } = useTenants({ enabled: isSuperAdmin });
	const createUser = useCreateUser();

	const [credentials, setCredentials] = useState<{
		firstName: string;
		lastName: string;
		email: string;
		role: string;
		temporaryPassword?: string;
		tenantName?: string;
	} | null>(null);

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			router.back();
		}
	}

	return (
		<>
			<Dialog open={open && !credentials} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Crear Usuario</DialogTitle>
					</DialogHeader>
					<UserForm
						mode="create"
						isSuperAdmin={isSuperAdmin}
						tenants={tenants ?? []}
						selectedTenantId={currentUser?.tenantId}
						onCancel={() => handleOpenChange(false)}
						onSubmit={(formData) => {
							createUser.mutate(formData as CreateUserPayload, {
								onSuccess: (created) => {
									setCredentials({
										firstName: created.firstName,
										lastName: created.lastName,
										email: created.email,
										role: created.role,
										temporaryPassword: created.temporaryPassword,
										tenantName: tenants?.find((t) => t.id === created.tenantId)?.name,
									});
									toast.success('Usuario creado correctamente');
								},
								onError: (err: any) => {
									const resMsg = err?.response?.data?.message;
									const detail = Array.isArray(resMsg) ? resMsg.join(', ') : resMsg;
									const message =
										detail?.includes('409') ||
										detail?.includes('duplicate') ||
										detail?.includes('belongs to tenant') ||
										err.message?.includes('409')
											? 'El usuario ya pertenece a esta institución'
											: (detail ?? err.message ?? 'Error al crear el usuario');
									toast.error(message);
								},
							});
						}}
						isLoading={createUser.isPending}
					/>
				</DialogContent>
			</Dialog>

			<UserCredentialsDialog
				open={Boolean(credentials)}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) {
						setCredentials(null);
						handleOpenChange(false);
					}
				}}
				credentials={credentials}
			/>
		</>
	);
}
