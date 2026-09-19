'use client';

import type { CreateUserPayload } from '@repo/common';
import { useCreateUser } from '@repo/hooks';
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	PageHeader,
	UserForm,
} from '@repo/ui';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CreateUserDirectPage() {
	const router = useRouter();
	const createUser = useCreateUser();

	return (
		<div className="space-y-6 max-w-2xl mx-auto">
			<PageHeader
				title="Crear Usuario"
				description="Registrar un nuevo usuario en la plataforma"
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
						onSubmit={(formData) => {
							createUser.mutate(formData as CreateUserPayload, {
								onSuccess: () => {
									toast.success('Usuario creado correctamente');
									router.push('/settings/users');
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
				</CardContent>
			</Card>
		</div>
	);
}
