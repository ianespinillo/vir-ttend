'use client';

import { useChangePassword, useProfile } from '@repo/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { ErrorState } from '../../shared/error-state';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { PageHeader } from '../../shared/page-header';
import { PasswordForm } from './password-form';

export function ProfilePage() {
	const { data: user, isLoading, error } = useProfile();
	const changePassword = useChangePassword();

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorState description={error.message} />;
	if (!user) return null;

	return (
		<div className="space-y-6">
			<PageHeader title="Mi Perfil" description="Información de tu cuenta" />

			<div className="mx-auto max-w-2xl space-y-6">
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Cambiar contraseña</CardTitle>
					</CardHeader>
					<CardContent>
						<PasswordForm
							onSubmit={(data) => changePassword.mutate(data)}
							isLoading={changePassword.isPending}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
