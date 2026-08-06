'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type CreateAcademicYearFormValues,
	createAcademicYearSchema,
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
import { Switch } from '../../../ui/switch';

export interface AcademicYearFormProps {
	onSubmit: (
		data: CreateAcademicYearFormValues & { isActive?: boolean },
	) => Promise<void> | void;
	isLoading?: boolean;
	defaultValues?: Partial<CreateAcademicYearFormValues & { isActive?: boolean }>;
	isEditing?: boolean;
	onCancel?: () => void;
}

export function AcademicYearForm({
	onSubmit,
	isLoading = false,
	defaultValues,
	isEditing = false,
	onCancel,
}: AcademicYearFormProps) {
	const currentYear = new Date().getFullYear();

	const form = useForm<CreateAcademicYearFormValues & { isActive?: boolean }>({
		resolver: zodResolver(createAcademicYearSchema),
		defaultValues: {
			year: defaultValues?.year || currentYear,
			startDate: defaultValues?.startDate
				? String(defaultValues.startDate).split('T')[0]
				: `${currentYear}-03-01`,
			endDate: defaultValues?.endDate
				? String(defaultValues.endDate).split('T')[0]
				: `${currentYear}-12-15`,
			absenceThresholdPercent: defaultValues?.absenceThresholdPercent ?? 15,
			lateCountAbscenseAfterMinutes:
				defaultValues?.lateCountAbscenseAfterMinutes ?? 15,
			isActive: defaultValues?.isActive ?? true,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Configuración del Año Lectivo</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="year"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Año Lectivo (Ej. 2026) *</FormLabel>
									<FormControl>
										<Input type="number" placeholder="2026" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isActive"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-1">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Año Activo</FormLabel>
										<p className="text-xs text-muted-foreground">
											Establece este año como el periodo lectivo en curso
										</p>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="startDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Fecha de Inicio *</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="endDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Fecha de Fin *</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="absenceThresholdPercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Umbral Máximo de Inasistencias (%) *</FormLabel>
									<FormControl>
										<Input type="number" min="1" max="100" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="lateCountAbscenseAfterMinutes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tolerancia de Tardanza (minutos) *</FormLabel>
									<FormControl>
										<Input type="number" min="0" {...field} />
									</FormControl>
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
								: 'Crear Año Lectivo'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
