'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	DAYOFWEEK,
	type IScheduleSlotResponse,
	type ISubjectResponse,
	type ScheduleSlotFormValues,
	checkScheduleOverlap,
	scheduleSlotSchema,
} from '@repo/common';
import { useState } from 'react';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';

export interface ScheduleFormProps {
	subjects: ISubjectResponse[];
	existingSlots?: IScheduleSlotResponse[];
	defaultDay?: DAYOFWEEK;
	onSubmit: (slot: ScheduleSlotFormValues) => Promise<void> | void;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function ScheduleForm({
	subjects,
	existingSlots = [],
	defaultDay = DAYOFWEEK.MONDAY,
	onSubmit,
	onCancel,
	isLoading = false,
}: ScheduleFormProps) {
	const [overlapError, setOverlapError] = useState<string | null>(null);

	const form = useForm<ScheduleSlotFormValues>({
		resolver: zodResolver(scheduleSlotSchema),
		defaultValues: {
			subjectId: subjects[0]?.id || '',
			dayOfWeek: defaultDay,
			startTime: '08:00',
			endTime: '09:20',
		},
	});

	const handleSubmit = async (values: ScheduleSlotFormValues) => {
		setOverlapError(null);

		// Client-side overlap validation
		const isOverlapping = checkScheduleOverlap([
			...existingSlots,
			{
				dayOfWeek: values.dayOfWeek,
				startTime: values.startTime,
				endTime: values.endTime,
			},
		]);

		if (isOverlapping) {
			setOverlapError(
				'La franja horaria ingresada se solapa con una clase ya existente para este día.',
			);
			return;
		}

		await onSubmit(values);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
				{overlapError && (
					<div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium">
						{overlapError}
					</div>
				)}

				<FormField
					control={form.control}
					name="subjectId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Materia *</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccione materia" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{subjects.map((sub) => (
										<SelectItem key={sub.id} value={sub.id}>
											{sub.name} ({sub.weeklyHours} hs/sem)
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
					name="dayOfWeek"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Día de la Semana *</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccione día" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={DAYOFWEEK.MONDAY}>Lunes</SelectItem>
									<SelectItem value={DAYOFWEEK.TUESDAY}>Martes</SelectItem>
									<SelectItem value={DAYOFWEEK.WEDNESDAY}>Miércoles</SelectItem>
									<SelectItem value={DAYOFWEEK.THURSDAY}>Jueves</SelectItem>
									<SelectItem value={DAYOFWEEK.FRIDAY}>Viernes</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="startTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Hora de Inicio (HH:mm) *</FormLabel>
								<FormControl>
									<Input type="time" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="endTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Hora de Fin (HH:mm) *</FormLabel>
								<FormControl>
									<Input type="time" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex items-center justify-end gap-2 pt-4">
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
						{isLoading ? 'Guardando...' : 'Agregar Franja'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
