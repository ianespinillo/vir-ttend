'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	COMMISSION_NUMBERS,
	type CommissionNumber,
	DAYOFWEEK,
	type IScheduleSlotResponse,
	type ISubjectResponse,
	SUBJECT_KIND,
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
	/**
	 * Workshop commissions of the course. The commission selector only shows
	 * with two or more; with one or none slots are saved for the whole course
	 * (null). Undefined = unknown, which offers both commissions.
	 */
	commissionNumbers?: readonly CommissionNumber[];
}

export function ScheduleForm({
	subjects,
	existingSlots = [],
	commissionNumbers,
	defaultDay = DAYOFWEEK.MONDAY,
	onSubmit,
	onCancel,
	isLoading = false,
}: ScheduleFormProps) {
	const [formError, setFormError] = useState<string | null>(null);

	const form = useForm<ScheduleSlotFormValues>({
		resolver: zodResolver(scheduleSlotSchema),
		defaultValues: {
			subjectId: subjects[0]?.id || '',
			dayOfWeek: defaultDay,
			startTime: '08:00',
			endTime: '09:20',
			commissionNumber: null,
		},
	});

	const availableCommissions = commissionNumbers ?? COMMISSION_NUMBERS;
	// Commissions a slot for the whole course counts towards.
	const courseCommissions =
		availableCommissions.length > 0 ? availableCommissions : COMMISSION_NUMBERS;
	const canPickCommission = availableCommissions.length > 1;
	const isWorkshopSubject = (subjectId: string) =>
		subjects.find((sub) => sub.id === subjectId)?.kind === SUBJECT_KIND.WORKSHOP;
	const showCommission =
		canPickCommission && isWorkshopSubject(form.watch('subjectId'));

	const handleSubmit = async (values: ScheduleSlotFormValues) => {
		setFormError(null);

		const subject = subjects.find((sub) => sub.id === values.subjectId);
		// Only workshop subjects of a course with two commissions can target one;
		// every other slot covers the whole course.
		const commissionNumber =
			canPickCommission && isWorkshopSubject(values.subjectId)
				? (values.commissionNumber ?? null)
				: null;

		// Client-side overlap validation
		const isOverlapping = checkScheduleOverlap([
			...existingSlots,
			{
				dayOfWeek: values.dayOfWeek,
				startTime: values.startTime,
				endTime: values.endTime,
				commissionNumber,
			},
		]);

		if (isOverlapping) {
			setFormError(
				'La franja horaria ingresada se solapa con una clase ya existente para este día.',
			);
			return;
		}

		if (subject) {
			const newSlotMinutes = minutesBetween(values.startTime, values.endTime);
			// Weekly hours are counted per existing commission: a slot for the whole
			// course counts towards each of them.
			const affectedCommissions =
				commissionNumber === null ? courseCommissions : [commissionNumber];
			const exceedsWeeklyHours = affectedCommissions.some((commission) => {
				const scheduledMinutes = existingSlots
					.filter(
						(slot) =>
							slot.subjectId === values.subjectId &&
							(slot.commissionNumber == null || slot.commissionNumber === commission),
					)
					.reduce(
						(total, slot) => total + minutesBetween(slot.startTime, slot.endTime),
						0,
					);
				return scheduledMinutes + newSlotMinutes > subject.weeklyHours * 60;
			});

			if (exceedsWeeklyHours) {
				setFormError(
					`Esta franja haría que ${subject.name} supere sus horas semanales (máximo ${subject.weeklyHours} hs/sem).`,
				);
				return;
			}
		}

		await onSubmit({ ...values, commissionNumber });
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
				{formError && (
					<div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium">
						{formError}
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

				{showCommission && (
					<FormField
						control={form.control}
						name="commissionNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Comisión</FormLabel>
								<Select
									onValueChange={(value) =>
										field.onChange(value === 'BOTH' ? null : Number(value))
									}
									value={field.value == null ? 'BOTH' : String(field.value)}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Seleccione comisión" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="BOTH">Ambas</SelectItem>
										{availableCommissions.map((number) => (
											<SelectItem key={number} value={String(number)}>
												{number}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

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

const minutesBetween = (start: string, end: string): number => {
	const [startHours = 0, startMinutes = 0] = start.split(':').map(Number);
	const [endHours = 0, endMinutes = 0] = end.split(':').map(Number);
	return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
};
