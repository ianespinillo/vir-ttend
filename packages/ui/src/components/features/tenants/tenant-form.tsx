'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateTenantPayload, UpdateTenantPayload } from '@repo/common';
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

export interface TenantFormProps {
	mode: 'create' | 'edit';
	initial?: {
		name: string;
		contactEmail: string;
		subdomain?: string;
	};
	onSubmit: (data: CreateTenantPayload | UpdateTenantPayload) => void;
	isLoading?: boolean;
}

export function TenantForm({
	mode,
	initial,
	onSubmit,
	isLoading,
}: Readonly<TenantFormProps>) {
	const form = useForm<CreateTenantPayload>({
		defaultValues: {
			name: initial?.name ?? '',
			contactEmail: initial?.contactEmail ?? '',
			subdomain: initial?.subdomain ?? '',
		},
	});

	useEffect(() => {
		if (initial) {
			form.reset(initial);
		}
	}, [initial, form]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					rules={{
						required: 'El nombre es obligatorio',
					}}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre *</FormLabel>
							<FormControl>
								<Input placeholder="Ej. Instituto San Martín" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{mode === 'create' && (
					<FormField
						control={form.control}
						name="subdomain"
						rules={{
							required: 'El subdominio es obligatorio',
						}}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Subdominio *</FormLabel>
								<FormControl>
									<Input placeholder="ej. san-martin" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				<FormField
					control={form.control}
					name="contactEmail"
					rules={{
						required: 'El email de contacto es obligatorio',
					}}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email de contacto *</FormLabel>
							<FormControl>
								<Input type="email" placeholder="admin@instituto.edu.ar" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end">
					<Button type="submit" disabled={isLoading}>
						{isLoading
							? 'Guardando...'
							: mode === 'create'
								? 'Crear Institución'
								: 'Guardar cambios'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
