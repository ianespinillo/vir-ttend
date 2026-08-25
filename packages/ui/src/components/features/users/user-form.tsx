'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, updateUserSchema } from '@repo/common';
import type { CreateUserInput, UpdateUserInput } from '@repo/common';
import { useEffect } from 'react';
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

export interface UserFormProps {
	mode: 'create' | 'edit';
	initial?: {
		firstName: string;
		lastName: string;
		email?: string;
		role?: string;
	};
	onSubmit: (data: CreateUserInput | UpdateUserInput) => void;
	isLoading?: boolean;
}

export function UserForm({
	mode,
	initial,
	onSubmit,
	isLoading,
}: Readonly<UserFormProps>) {
	const isCreate = mode === 'create';
	const schema = isCreate ? createUserSchema : updateUserSchema;

	const form = useForm<CreateUserInput | UpdateUserInput>({
		resolver: zodResolver(schema),
		defaultValues: isCreate
			? {
					email: '',
					firstName: '',
					lastName: '',
					role: 'preceptor',
				}
			: {
					firstName: initial?.firstName ?? '',
					lastName: initial?.lastName ?? '',
				},
	});

	useEffect(() => {
		if (initial) {
			form.reset(
				isCreate
					? {
							email: initial.email ?? '',
							firstName: initial.firstName,
							lastName: initial.lastName,
							role: initial.role ?? 'preceptor',
						}
					: {
							firstName: initial.firstName,
							lastName: initial.lastName,
						},
			);
		}
	}, [initial, form, isCreate]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="firstName"
					rules={{
						required: 'El nombre es obligatorio',
					}}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre *</FormLabel>
							<FormControl>
								<Input placeholder="Nombre" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="lastName"
					rules={{
						required: 'El apellido es obligatorio',
					}}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Apellido *</FormLabel>
							<FormControl>
								<Input placeholder="Apellido" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{isCreate && (
					<>
						<FormField
							control={form.control}
							name="email"
							rules={{
								required: 'El email es obligatorio',
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email *</FormLabel>
									<FormControl>
										<Input type="email" placeholder="usuario@email.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Rol</FormLabel>
									<FormControl>
										<select
											className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
											{...field}
										>
											<option value="admin">Admin</option>
											<option value="preceptor">Preceptor</option>
											<option value="teacher">Teacher</option>
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}
				<div className="flex justify-end">
					<Button type="submit" disabled={isLoading}>
						{isLoading
							? 'Guardando...'
							: isCreate
								? 'Crear Usuario'
								: 'Guardar cambios'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
