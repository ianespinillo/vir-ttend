'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type CreateStudentFormValues,
	type ICourseResponse,
	createStudentSchema,
} from '@repo/common';
import { Check } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { localizeCourseName } from '../../../lib/shift';
import { cn } from '../../../lib/utils';
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

const STEP1_FIELDS = [
	'firstName',
	'lastName',
	'documentNumber',
	'birthDate',
	'courseId',
] as const;

const STEP1_FIELD_SET = new Set<string>(STEP1_FIELDS);

const STEP_LABELS = ['Estudiante', 'Tutor'];

const STEP_TITLES = [
	'Datos personales del estudiante',
	'Información del tutor responsable',
];

export interface StudentFormProps {
	onSubmit: (data: CreateStudentFormValues) => Promise<void> | void;
	isLoading?: boolean;
	defaultValues?: Partial<CreateStudentFormValues>;
	courses: ICourseResponse[];
	isEditing?: boolean;
	onCancel?: () => void;
	errorMessage?: string | null;
	/** 'page' keeps the Card surface; 'dialog' renders bare (no double frame). */
	variant?: 'page' | 'dialog';
	/** Field flagged by the server (e.g. 409 duplicate DNI); jumps to its step. */
	errorField?: keyof CreateStudentFormValues;
}

interface StepIndicatorProps {
	currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
	return (
		<ol aria-label="Pasos del formulario" className="flex items-center gap-3">
			{STEP_LABELS.map((label, index) => {
				const isCompleted = index < currentStep;
				const isActive = index === currentStep;
				return (
					<Fragment key={label}>
						{index > 0 && (
							<li
								aria-hidden="true"
								className={cn(
									'h-px flex-1',
									index <= currentStep ? 'bg-primary/40' : 'bg-border',
								)}
							/>
						)}
						<li
							aria-current={isActive ? 'step' : undefined}
							className="flex items-center gap-2"
						>
							<span
								className={cn(
									'flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium',
									isCompleted && 'border-primary/40 bg-primary/10 text-primary',
									isActive && 'border-primary bg-primary text-primary-foreground',
									!isCompleted && !isActive && 'border-border text-muted-foreground',
								)}
							>
								{isCompleted ? (
									<Check aria-hidden="true" className="h-3.5 w-3.5" />
								) : (
									index + 1
								)}
							</span>
							<span
								className={cn(
									'text-sm',
									isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
								)}
							>
								{label}
							</span>
						</li>
					</Fragment>
				);
			})}
		</ol>
	);
}

export function StudentForm({
	onSubmit,
	isLoading = false,
	defaultValues,
	courses,
	isEditing = false,
	onCancel,
	errorMessage,
	variant = 'page',
	errorField,
}: StudentFormProps) {
	const [step, setStep] = useState(0);
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

	useEffect(() => {
		if (!errorField) {
			return;
		}
		setStep(STEP1_FIELD_SET.has(errorField) ? 0 : 1);
	}, [errorField]);

	async function handleNext() {
		const ok = await form.trigger(STEP1_FIELDS);
		if (!ok) {
			return;
		}
		setStep(1);
	}

	const body = (
		<div className="space-y-6">
			{errorMessage && (
				<div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium">
					{errorMessage}
				</div>
			)}
			<StepIndicator currentStep={step} />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{step === 0 && (
					<>
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
										<Input placeholder="Ej. 42123456" {...field} disabled={isEditing} />
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
									<FormLabel>Fecha de nacimiento *</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<h3 className="md:col-span-2 text-sm font-medium text-muted-foreground">
							Asignación
						</h3>

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
										disabled={isEditing}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccione un curso" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{courses.map((course) => (
												<SelectItem key={course.id} value={course.id}>
													{localizeCourseName(course.fullName) ||
														`${course.yearNumber}° ${course.division} (${course.level})`}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

				{step === 1 && (
					<>
						<FormField
							control={form.control}
							name="tutorName"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Nombre completo del tutor *</FormLabel>
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
									<FormLabel>Teléfono de contacto *</FormLabel>
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
									<FormLabel>Correo electrónico (opcional)</FormLabel>
									<FormControl>
										<Input type="email" placeholder="Ej. tutor@ejemplo.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}
			</div>

			<div className="flex items-center justify-end gap-3 border-t pt-4">
				{step === 0 && (
					<>
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
						<Button type="button" onClick={handleNext} disabled={isLoading}>
							Siguiente
						</Button>
					</>
				)}

				{step === 1 && (
					<>
						<Button
							type="button"
							variant="outline"
							onClick={() => setStep(0)}
							disabled={isLoading}
						>
							Atrás
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading
								? 'Guardando...'
								: isEditing
									? 'Guardar Cambios'
									: 'Crear Estudiante'}
						</Button>
					</>
				)}
			</div>
		</div>
	);

	return (
		<Form {...form}>
			<form className="max-w-3xl" onSubmit={form.handleSubmit(onSubmit)}>
				{variant === 'page' && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">{STEP_TITLES[step]}</CardTitle>
						</CardHeader>
						<CardContent>{body}</CardContent>
					</Card>
				)}

				{variant === 'dialog' && body}
			</form>
		</Form>
	);
}
