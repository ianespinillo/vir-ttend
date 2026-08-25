'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type AnnouncementTargetType,
	type CreateAnnouncementFormValues,
	type ICourseResponse,
	createAnnouncementSchema,
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
import { Textarea } from '../../../ui/textarea';
import { AnnouncementTargetSelect } from './announcement-target-select';

export interface AnnouncementFormProps {
	mode: 'create' | 'edit';
	courses: ICourseResponse[];
	isLoadingCourses?: boolean;
	/** Audiencias permitidas para el rol actual (default: todas). */
	allowedTargetTypes?: AnnouncementTargetType[];
	defaultValues?: Partial<CreateAnnouncementFormValues>;
	isSubmitting?: boolean;
	errorMessage?: string | null;
	onSubmit: (values: CreateAnnouncementFormValues) => Promise<void> | void;
	onCancel?: () => void;
}

export function AnnouncementForm({
	mode,
	courses,
	isLoadingCourses,
	allowedTargetTypes = ['school', 'course', 'level'],
	defaultValues,
	isSubmitting,
	errorMessage,
	onSubmit,
	onCancel,
}: Readonly<AnnouncementFormProps>) {
	const fallbackTargetType =
		defaultValues?.targetType &&
		allowedTargetTypes.includes(defaultValues.targetType)
			? defaultValues.targetType
			: (allowedTargetTypes[0] ?? 'course');

	const form = useForm<CreateAnnouncementFormValues>({
		resolver: zodResolver(createAnnouncementSchema),
		defaultValues: {
			title: '',
			body: '',
			targetType: fallbackTargetType,
			targetId: '',
			publishAt: null,
			...defaultValues,
		},
	});

	const targetType = form.watch('targetType');

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{mode === 'create' ? 'Nuevo comunicado' : 'Editar comunicado'}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5">
						{errorMessage && (
							<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
								{errorMessage}
							</div>
						)}

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Título *</FormLabel>
										<FormControl>
											<Input placeholder="Ej. Reunión de familias" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="targetType"
								render={() => (
									<FormItem>
										<FormLabel>Audiencia *</FormLabel>
										<FormControl>
											<AnnouncementTargetSelect
												targetType={targetType}
												targetId={form.watch('targetId')}
												courses={courses}
												allowedTargetTypes={allowedTargetTypes}
												disabled={isLoadingCourses}
												onTargetTypeChange={(value) => {
													form.setValue('targetType', value);
													form.setValue('targetId', '');
												}}
												onTargetIdChange={(value) => form.setValue('targetId', value)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="body"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contenido *</FormLabel>
									<FormControl>
										<Textarea
											className="min-h-32"
											placeholder="Escribí el comunicado..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{mode === 'create' && (
							<FormField
								control={form.control}
								name="publishAt"
								render={({ field }) => (
									<FormItem className="md:w-1/2">
										<FormLabel>Programar publicación (opcional)</FormLabel>
										<FormControl>
											<Input
												type="datetime-local"
												value={field.value ?? ''}
												onChange={(e) => field.onChange(e.target.value || null)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
					</CardContent>
				</Card>

				<div className="flex items-center justify-end gap-3">
					{onCancel && (
						<Button
							type="button"
							variant="ghost"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
					)}
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? 'Guardando...'
							: mode === 'create'
								? 'Publicar comunicado'
								: 'Guardar cambios'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
