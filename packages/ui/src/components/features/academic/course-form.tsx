'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type CreateCourseFormValues,
	type IAcademicYearResponse,
	type IUserResponse,
	LEVEL,
	SHIFT,
	createCourseSchema,
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

export interface CourseFormProps {
	onSubmit: (data: CreateCourseFormValues) => Promise<void> | void;
	isLoading?: boolean;
	defaultValues?: Partial<CreateCourseFormValues>;
	academicYears: IAcademicYearResponse[];
	preceptors?: IUserResponse[];
	isEditing?: boolean;
	onCancel?: () => void;
}

export function CourseForm({
	onSubmit,
	isLoading = false,
	defaultValues,
	academicYears,
	preceptors = [],
	isEditing = false,
	onCancel,
}: CourseFormProps) {
	const activeAY = academicYears.find((y) => y.isActive) || academicYears[0];

	const form = useForm<CreateCourseFormValues>({
		resolver: zodResolver(createCourseSchema),
		defaultValues: {
			academicYearId: defaultValues?.academicYearId || activeAY?.id || '',
			level: defaultValues?.level || LEVEL.SECONDARY,
			yearNumber: defaultValues?.yearNumber || 1,
			division: defaultValues?.division || 'A',
			shift: defaultValues?.shift || SHIFT.MORNING,
			preceptorId: defaultValues?.preceptorId || '',
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{isEditing ? 'Editar Curso' : 'Datos del Nuevo Curso'}
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="academicYearId"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Ciclo Lectivo *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccione ciclo lectivo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{academicYears.map((ay) => (
												<SelectItem key={ay.id} value={ay.id}>
													Año Lectivo {ay.year} {ay.isActive ? '(Activo)' : ''}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="level"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nivel Educativo *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccione nivel" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={LEVEL.SECONDARY}>Secundaria</SelectItem>
											<SelectItem value={LEVEL.PRIMARY}>Primaria</SelectItem>
											<SelectItem value={LEVEL.DEFAULT}>Inicial / Otro</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="shift"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Turno *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccione turno" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={SHIFT.MORNING}>Mañana</SelectItem>
											<SelectItem value={SHIFT.AFTERNOON}>Tarde</SelectItem>
											<SelectItem value={SHIFT.EVENING}>Noche / Vespertino</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="yearNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Año / Grado (Número) *</FormLabel>
									<FormControl>
										<Input type="number" min="1" max="12" placeholder="1" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="division"
							render={({ field }) => (
								<FormItem>
									<FormLabel>División / Sección *</FormLabel>
									<FormControl>
										<Input placeholder="Ej. A, B, 1" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="preceptorId"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Preceptor Asignado (Opcional)</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value || 'NONE'}
										value={field.value || 'NONE'}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccione preceptor" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="NONE">Sin preceptor asignado</SelectItem>
											{preceptors.map((p) => (
												<SelectItem key={p.id} value={p.id}>
													{p.firstName} {p.lastName} ({p.email})
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
								: 'Crear Curso'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
