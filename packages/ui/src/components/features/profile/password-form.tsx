'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '@repo/common';
import type { ChangePasswordInput } from '@repo/common';
import { useForm } from 'react-hook-form';
import { Button } from '../../../ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';

export interface PasswordFormProps {
	onSubmit: (data: ChangePasswordInput) => void;
	isLoading?: boolean;
}

export function PasswordForm({
	onSubmit,
	isLoading,
}: Readonly<PasswordFormProps>) {
	const form = useForm<ChangePasswordInput>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="currentPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Contraseña actual</FormLabel>
							<FormControl>
								<Input type="password" placeholder="••••••••" {...field} />
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
								<Input type="password" placeholder="••••••••" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirmar contraseña</FormLabel>
							<FormControl>
								<Input type="password" placeholder="••••••••" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end">
					<Button type="submit" disabled={isLoading}>
						{isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
