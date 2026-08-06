'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type CreateSubjectFormValues,
	type IUserResponse,
	createSubjectSchema,
} from '@repo/common';
import { useForm } from 'react-hook-form';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
	Form,
	FormControl,
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

export interface SubjectFormProps {
	courseId: string;
	onSubmit: (data: CreateSubjectFormValues) => Promise<void> | void;
	isLoading?: boolean;
	defaultValues?: Partial<CreateSubjectFormValues>;
	teachers?: IUserResponse[];
	isEditing?: boolean;
	onCancel?: () => void;
}

export function SubjectForm({
	courseId,
	onSubmit,
	isLoading = false,
	defaultValues,
	teachers = [],
	isEditing = false,
	onCancel,
}: SubjectFormProps) {
	const form = useForm<CreateSubjectFormValues>({
		resolver: zodResolver(createSubjectSchema),
		defaultValues: {
			courseId: defaultValues?.courseId || courseId,
			name: defaultValues?.name || '',
			area: defaultValues?.area || '',
			weeklyHours: defaultValues?.weeklyHours || 4,
			teacherId: defaultValues?.teacherId || '',
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{isEditing ? 'Editar Materia' : 'Nueva Materia'}
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Nombre de la Materia *</FormLabel>
									<FormControl>
										<Input placeholder="Ej. Matemática, Historia" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="area"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Área / Departamento *</FormLabel>
									<FormControl>
										<Input placeholder="Ej. Ciencias Exactas" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="weeklyHours"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Horas Semanales *</FormLabel>
									<FormControl>
										<Input type="number" min="1" max="40" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="teacherId"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Docente Titular (Opcional)</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value || 'NONE'}
										value={field.value || 'NONE'}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccione docente" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="NONE">Sin docente asignado</SelectItem>
											{teachers.map((t) => (
												<SelectItem key={t.id} value={t.id}>
													{t.firstName} {t.lastName} ({t.email})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<div className="flex items-center justify-end gap-3">
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
							: isEditing
								? 'Guardar Cambios'
								: 'Crear Materia'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
