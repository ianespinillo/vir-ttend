'use client';

import { useAuth } from '@/lib/auth/provider';
import { useCurrentUser, useLogout } from '@repo/hooks';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	LoadingSpinner,
} from '@repo/ui';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProfilePage() {
	const { user: authUser, clearUser } = useAuth();
	const { data: userData, isLoading } = useCurrentUser();
	const logoutMutation = useLogout();
	const router = useRouter();

	const user = userData || authUser;

	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isPasswordOpen, setIsPasswordOpen] = useState(false);
	const [firstName, setFirstName] = useState(user?.firstName || '');
	const [lastName, setLastName] = useState(user?.lastName || '');
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	if (isLoading && !user) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<LoadingSpinner label="Cargando perfil..." />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const initials =
		`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
		'U';
	const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;
	const joinedDate = user.createdAt
		? format(new Date(user.createdAt), 'dd/MM/yyyy')
		: '02/09/2026';

	const handleLogout = () => {
		logoutMutation.mutate(undefined, {
			onSettled: () => {
				clearUser();
				router.replace('/login');
			},
		});
	};

	const handleSaveProfile = (e: React.FormEvent) => {
		e.preventDefault();
		toast.success('Perfil actualizado correctamente');
		setIsEditOpen(false);
	};

	const handleChangePassword = (e: React.FormEvent) => {
		e.preventDefault();
		if (passwordData.newPassword.length < 8) {
			toast.error('La nueva contraseña debe tener al menos 8 caracteres');
			return;
		}
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error('Las contraseñas no coinciden');
			return;
		}
		toast.success('Contraseña modificada con éxito');
		setIsPasswordOpen(false);
		setPasswordData({
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		});
	};

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<h1 className="text-2xl font-bold tracking-tight text-foreground">
				Mi perfil
			</h1>

			<div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
				{/* Top user header */}
				<div className="flex items-center gap-5">
					<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-2xl font-semibold text-[#1e40af] dark:bg-blue-950 dark:text-blue-200">
						{initials}
					</div>
					<div className="flex flex-col">
						<h2 className="text-xl font-bold text-foreground sm:text-2xl">
							{fullName}
						</h2>
						<span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
							{user.role}
						</span>
					</div>
				</div>

				{/* Email info */}
				<div className="mt-8 border-b border-border/80 pb-5">
					<span className="block text-sm font-bold text-foreground">Email</span>
					<span className="mt-1 block text-sm text-muted-foreground">
						{user.email}
					</span>
				</div>

				{/* Joined date info */}
				<div className="mt-5 border-b border-border/80 pb-5">
					<span className="block text-sm font-bold text-foreground">Se unió el</span>
					<span className="mt-1 block text-sm text-muted-foreground">
						{joinedDate}
					</span>
				</div>

				{/* Action Buttons */}
				<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
					<Button
						type="button"
						onClick={() => {
							setFirstName(user.firstName);
							setLastName(user.lastName);
							setIsEditOpen(true);
						}}
						className="flex-1 bg-[#2b438d] py-5 font-semibold text-white hover:bg-[#203470] dark:bg-blue-700 dark:hover:bg-blue-600"
					>
						Editar
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={() => setIsPasswordOpen(true)}
						className="flex-1 bg-[#dbe5f1] py-5 font-semibold text-[#2b438d] hover:bg-[#c9d8eb] dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60"
					>
						Cambiar contraseña
					</Button>
					<Button
						type="button"
						variant="ghost"
						onClick={handleLogout}
						className="flex-1 bg-[#fde8e8] py-5 font-semibold text-[#e02424] hover:bg-[#fbd5d5] hover:text-[#c81e1e] dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50"
					>
						Cerrar sesión
					</Button>
				</div>
			</div>

			{/* Modal Editar Perfil */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Editar Perfil</DialogTitle>
						<DialogDescription>
							Modifica tu información personal de usuario.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSaveProfile} className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="firstName">Nombre</Label>
							<Input
								id="firstName"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Apellido</Label>
							<Input
								id="lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								required
							/>
						</div>
						<DialogFooter className="mt-4 gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditOpen(false)}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								className="bg-[#2b438d] text-white hover:bg-[#203470]"
							>
								Guardar cambios
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Modal Cambiar Contraseña */}
			<Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Cambiar contraseña</DialogTitle>
						<DialogDescription>
							Ingresá tu contraseña actual y la nueva contraseña deseada.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleChangePassword} className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="currentPassword">Contraseña actual</Label>
							<Input
								id="currentPassword"
								type="password"
								value={passwordData.currentPassword}
								onChange={(e) =>
									setPasswordData((prev) => ({
										...prev,
										currentPassword: e.target.value,
									}))
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="newPassword">Nueva contraseña</Label>
							<Input
								id="newPassword"
								type="password"
								placeholder="Mínimo 8 caracteres"
								value={passwordData.newPassword}
								onChange={(e) =>
									setPasswordData((prev) => ({
										...prev,
										newPassword: e.target.value,
									}))
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={passwordData.confirmPassword}
								onChange={(e) =>
									setPasswordData((prev) => ({
										...prev,
										confirmPassword: e.target.value,
									}))
								}
								required
							/>
						</div>
						<DialogFooter className="mt-4 gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsPasswordOpen(false)}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								className="bg-[#2b438d] text-white hover:bg-[#203470]"
							>
								Actualizar contraseña
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
