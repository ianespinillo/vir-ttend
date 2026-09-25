'use client';

import { useDemo } from '@/lib/session/demo-provider';
import type { ChangePasswordInput } from '@repo/common';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	PageHeader,
	PasswordForm,
} from '@repo/ui';
import { useState } from 'react';

export default function ProfileMePage() {
	const { session, store } = useDemo();
	const user = session.user;

	const [feedback, setFeedback] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	if (!user) {
		return (
			<EmptyState
				title="Sesión no iniciada"
				description="Elegí un perfil en la pantalla inicial para entrar a la demo."
			/>
		);
	}

	const handleChangePassword = (data: ChangePasswordInput) => {
		setFeedback(null);
		try {
			store.changePassword(user.id, data);
			setFeedback({
				type: 'success',
				message: 'Contraseña actualizada correctamente.',
			});
		} catch (err: unknown) {
			setFeedback({
				type: 'error',
				message:
					err instanceof Error
						? err.message
						: 'No se pudo actualizar la contraseña.',
			});
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader title="Mi Perfil" description="Información de tu cuenta" />

			<div className="mx-auto max-w-2xl space-y-6">
				{feedback && (
					<div
						className={`rounded-md border p-3 text-sm ${
							feedback.type === 'success'
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
								: 'border-destructive/30 bg-destructive/10 text-destructive'
						}`}
					>
						{feedback.message}
					</div>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Datos personales</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Nombre</span>
							<span className="text-sm font-medium">
								{user.firstName} {user.lastName}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Email</span>
							<span className="text-sm font-medium">{user.email}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Rol</span>
							<span className="text-sm font-medium capitalize">{user.role}</span>
						</div>
						{user.tenantName && (
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">Institución</span>
								<span className="text-sm font-medium">{user.tenantName}</span>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Cambiar contraseña</CardTitle>
					</CardHeader>
					<CardContent>
						<PasswordForm onSubmit={handleChangePassword} isLoading={false} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
