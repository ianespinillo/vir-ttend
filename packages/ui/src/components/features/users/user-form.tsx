'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ROLES, createUserSchema, updateUserSchema } from '@repo/common';
import type { CreateUserInput, UpdateUserInput } from '@repo/common';
import { Building2, Mail, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';

export interface UserFormProps {
	mode: 'create' | 'edit';
	isSuperAdmin?: boolean;
	initial?: {
		firstName: string;
		lastName: string;
		email?: string;
		role?: string;
		tenantId?: string;
		tenantName?: string;
	};
	tenants?: { id: string; name: string }[];
	selectedTenantId?: string;
	onSubmit: (data: CreateUserInput | UpdateUserInput) => void;
	onCancel?: () => void;
	isLoading?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
	[ROLES.ADMIN]: 'Administrador',
	[ROLES.PRECEPTOR]: 'Preceptor',
	[ROLES.TEACHER]: 'Docente',
	[ROLES.SUPERADMIN]: 'Superadmin',
};

export function UserForm({
	mode,
	isSuperAdmin,
	initial,
	tenants = [],
	selectedTenantId,
	onSubmit,
	onCancel,
	isLoading,
}: Readonly<UserFormProps>) {
	const isCreate = mode === 'create';
	const schema = isCreate ? createUserSchema : updateUserSchema;

	const defaultTenant =
		selectedTenantId && selectedTenantId !== 'all'
			? selectedTenantId
			: (tenants[0]?.id ?? '');

	const form = useForm<CreateUserInput | UpdateUserInput>({
		resolver: zodResolver(schema),
		defaultValues: isCreate
			? {
					email: '',
					firstName: '',
					lastName: '',
					role: isSuperAdmin ? ROLES.ADMIN : ROLES.PRECEPTOR,
					tenantId: defaultTenant,
				}
			: {
					firstName: initial?.firstName ?? '',
					lastName: initial?.lastName ?? '',
					email: initial?.email ?? '',
				},
	});

	const watchedRole = form.watch('role' as keyof CreateUserInput);

	useEffect(() => {
		if (initial) {
			form.reset(
				isCreate
					? {
							email: initial.email ?? '',
							firstName: initial.firstName,
							lastName: initial.lastName,
							role: initial.role ?? (isSuperAdmin ? ROLES.ADMIN : ROLES.PRECEPTOR),
							tenantId: initial.tenantId ?? defaultTenant,
						}
					: {
							firstName: initial.firstName,
							lastName: initial.lastName,
							email: initial.email ?? '',
						},
			);
		}
	}, [initial, form, isCreate, defaultTenant, isSuperAdmin]);

	// Roles a mostrar según sea SuperAdmin o Admin
	const availableRoles = isSuperAdmin
		? [ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER, ROLES.SUPERADMIN]
		: [ROLES.PRECEPTOR, ROLES.TEACHER];

	const showTenantSelector =
		isCreate && isSuperAdmin && watchedRole !== ROLES.SUPERADMIN;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{!isCreate && (
					<div className="rounded-lg border bg-muted/40 p-3 space-y-2 mb-4">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">
								Usuario a editar
							</span>
							<div className="flex items-center gap-1.5">
								{initial?.role && (
									<Badge variant="secondary" className="text-xs">
										<Shield className="mr-1 h-3 w-3" />
										{ROLE_LABELS[initial.role] ?? initial.role}
									</Badge>
								)}
								{initial?.tenantName && (
									<Badge variant="outline" className="text-xs">
										<Building2 className="mr-1 h-3 w-3" />
										{initial.tenantName}
									</Badge>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2 text-sm text-foreground">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<span className="font-mono text-xs">{initial?.email}</span>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nombre *</FormLabel>
								<FormControl>
									<Input placeholder="Ej. Juan" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="lastName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Apellido *</FormLabel>
								<FormControl>
									<Input placeholder="Ej. Pérez" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{isCreate && (
					<>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email *</FormLabel>
									<FormControl>
										<Input type="email" placeholder="usuario@colegio.edu" {...field} />
									</FormControl>
									<FormDescription className="text-xs">
										Se generará una contraseña provisoria para el primer acceso.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div
							className={`grid gap-4 ${showTenantSelector ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
						>
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Rol *</FormLabel>
										<Select onValueChange={field.onChange} value={field.value ?? ''}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar rol" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{availableRoles.map((r) => (
													<SelectItem key={r} value={r}>
														{ROLE_LABELS[r] ?? r}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{showTenantSelector && (
								<FormField
									control={form.control}
									name="tenantId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Institución asignada *</FormLabel>
											<Select onValueChange={field.onChange} value={field.value ?? ''}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar institución" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{tenants.map((t) => (
														<SelectItem key={t.id} value={t.id}>
															{t.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>
					</>
				)}

				<div className="flex justify-end gap-2 pt-2">
					{onCancel && (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={isLoading}
						>
							Cancelar
						</Button>
					)}
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
