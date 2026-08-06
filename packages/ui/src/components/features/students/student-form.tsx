'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type CreateStudentFormValues,
	type ICourseResponse,
	createStudentSchema,
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

export interface StudentFormProps {
	onSubmit: (data: CreateStudentFormValues) => Promise<void> | void;
	isLoading?: boolean;
	defaultValues?: Partial<CreateStudentFormValues>;
	courses: ICourseResponse[];
	isEditing?: boolean;
	onCancel?: () => void;
	errorMessage?: string | null;
}

export function StudentForm({
	onSubmit,
	isLoading = false,
	defaultValues,
	courses,
	isEditing = false,
	onCancel,
	errorMessage,
}: StudentFormProps) {
	const form = useForm<CreateStudentFormValues>({
		resolver: zodResolver(createStudentSchema),
		defaultValues: {
			firstName: defaultValues?.firstName || '',
			lastName: defaultValues?.lastName || '',
			documentNumber: defaultValues?.documentNumber || '',
			birthDate: defaultValues?.birthDate
				? String(defaultValues.birthDate).split('T')[0]
				: '',
			courseId: defaultValues?.courseId || '',
			tutorName: defaultValues?.tutorName || '',
			tutorPhone: defaultValues?.tutorPhone || '',
			tutorEmail: defaultValues?.tutorEmail || '',
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
				{errorMessage && (
					<div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium">
						{errorMessage}
					</div>
				)}

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Datos Personales del Estudiante</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

						<FormField
							control={form.control}
							name="documentNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>DNI / Documento *</FormLabel>
									<FormControl>
										<Input placeholder="Ej. 42123456" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="birthDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Fecha de Nacimiento *</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="courseId"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Curso *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccione un curso" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{courses.map((course) => (
												<SelectItem key={course.id} value={course.id}>
													{course.fullName ||
														`${course.yearNumber}° ${course.division} (${course.level})`}
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

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Información del Tutor Responsable
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="tutorName"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Nombre Completo del Tutor *</FormLabel>
									<FormControl>
										<Input placeholder="Ej. María Gómez" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="tutorPhone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Teléfono de Contacto *</FormLabel>
									<FormControl>
										<Input placeholder="Ej. 1123456789" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="tutorEmail"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Correo Electrónico (Opcional)</FormLabel>
									<FormControl>
										<Input type="email" placeholder="Ej. tutor@ejemplo.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<div className="flex items-center justify-end gap-3 pt-2">
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
								: 'Crear Estudiante'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
