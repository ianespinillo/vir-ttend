'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangePasswordInput, changePasswordSchema } from '@repo/common';
import { KeyRound, LogOut, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { PasswordInput } from './password-input';

export interface ForceChangePasswordDialogProps {
	open: boolean;
	onSubmit: (data: ChangePasswordInput) => void;
	isLoading?: boolean;
	onLogout?: () => void;
	errorMessage?: string | null;
}

export function ForceChangePasswordDialog({
	open,
	onSubmit,
	isLoading,
	onLogout,
	errorMessage,
}: Readonly<ForceChangePasswordDialogProps>) {
	const form = useForm<ChangePasswordInput>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			oldPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		},
	});

	return (
		<Dialog open={open}>
			<DialogContent
				className="sm:max-w-md [&>button]:hidden"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader className="text-center sm:text-left space-y-2">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-1">
						<KeyRound className="h-6 w-6" />
					</div>
					<DialogTitle className="text-xl font-bold">
						Actualizá tu contraseña
					</DialogTitle>
					<DialogDescription className="text-sm">
						Es tu primer ingreso al sistema o tu contraseña fue restablecida. Por
						motivos de seguridad, tenés que definir una nueva contraseña para
						continuar.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-start gap-2.5 rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
					<ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
					<p>
						Ingresá la contraseña temporal que te enviamos por correo electrónico y
						definí tu nueva clave personal (mínimo 8 caracteres).
					</p>
				</div>

				{errorMessage && (
					<div className="rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive">
						{errorMessage}
					</div>
				)}

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="oldPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contraseña temporal recibida</FormLabel>
									<FormControl>
										<PasswordInput
											placeholder="Ingresá la contraseña del correo"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nueva contraseña</FormLabel>
									<FormControl>
										<PasswordInput
											placeholder="Mínimo 8 caracteres"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirmNewPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirmar nueva contraseña</FormLabel>
									<FormControl>
										<PasswordInput
											placeholder="Repetí la nueva contraseña"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="pt-2 flex flex-col gap-2">
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? 'Actualizando contraseña...' : 'Guardar y continuar'}
							</Button>

							{onLogout && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="w-full text-muted-foreground hover:text-foreground"
									onClick={onLogout}
									disabled={isLoading}
								>
									<LogOut className="mr-2 h-4 w-4" />
									Cerrar sesión
								</Button>
							)}
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
