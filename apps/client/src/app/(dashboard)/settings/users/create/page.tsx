'use client';

import { type CreateUserPayload, ROLES } from '@repo/common';
import { useCreateUser, useCurrentUser, useTenants } from '@repo/hooks';
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	PageHeader,
	UserCredentialsDialog,
	UserForm,
} from '@repo/ui';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateUserDirectPage() {
	const router = useRouter();
	const { data: currentUser } = useCurrentUser();
	const isSuperAdmin = currentUser?.role === ROLES.SUPERADMIN;
	const { data: tenants } = useTenants();
	const createUser = useCreateUser();

	const [credentials, setCredentials] = useState<{
		firstName: string;
		lastName: string;
		email: string;
		role: string;
		temporaryPassword?: string;
		tenantName?: string;
	} | null>(null);

	return (
		<div className="space-y-6 max-w-2xl mx-auto">
			<PageHeader
				title="Crear Usuario"
				description={
					isSuperAdmin
						? 'Registrar un nuevo usuario en la institución o a nivel global'
						: 'Registrar un nuevo usuario en la plataforma escolar'
				}
				actions={
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push('/settings/users')}
					>
						<ArrowLeft className="mr-1.5 h-4 w-4" />
						Volver a usuarios
					</Button>
				}
			/>

			<Card className="shadow-xs border border-border/80">
				<CardHeader>
					<CardTitle className="text-base font-medium">
						Datos del nuevo usuario
					</CardTitle>
				</CardHeader>
				<CardContent>
					<UserForm
						mode="create"
						isSuperAdmin={isSuperAdmin}
						tenants={tenants ?? []}
						onCancel={() => router.push('/settings/users')}
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
				</CardContent>
			</Card>

			<UserCredentialsDialog
				open={Boolean(credentials)}
				onOpenChange={(open) => {
					if (!open) {
						setCredentials(null);
						router.push('/settings/users');
					}
				}}
				credentials={credentials}
			/>
		</div>
	);
}
