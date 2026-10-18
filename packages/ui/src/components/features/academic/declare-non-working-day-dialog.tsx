'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type DeclareNonWorkingDayFormValues,
	type IAcademicYearResponse,
	declareNonWorkingDaySchema,
} from '@repo/common';
import { AlertCircle, CalendarOff, Megaphone } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '../../../ui/alert';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
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
import { Switch } from '../../../ui/switch';

export interface DeclareNonWorkingDayDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	academicYear: IAcademicYearResponse | null;
	onSubmit: (values: DeclareNonWorkingDayFormValues) => Promise<void> | void;
	isLoading?: boolean;
}

const COMMON_REASONS = [
	{ label: 'Paro docente', type: 'strike' },
	{ label: 'Movilización docente', type: 'mobilization' },
	{ label: 'Feriado puente / asueto', type: 'holiday' },
	{ label: 'Jornada pedagógica', type: 'institutional' },
	{ label: 'Desinfección / Mantenimiento', type: 'maintenance' },
	{ label: 'Suspensión por clima', type: 'weather' },
];

export function DeclareNonWorkingDayDialog({
	open,
	onOpenChange,
	academicYear,
	onSubmit,
	isLoading = false,
}: DeclareNonWorkingDayDialogProps) {
	const todayStr = new Date().toISOString().split('T')[0];

	const form = useForm<DeclareNonWorkingDayFormValues>({
		resolver: zodResolver(declareNonWorkingDaySchema),
		defaultValues: {
			date: todayStr,
			reason: '',
			type: 'strike',
			notifySchool: true,
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				date: todayStr,
				reason: '',
				type: 'strike',
				notifySchool: true,
			});
		}
	}, [open, form, todayStr]);

	const handleSubmit = async (values: DeclareNonWorkingDayFormValues) => {
		await onSubmit(values);
	};

	const minDate = academicYear?.startDate
		? String(academicYear.startDate).split('T')[0]
		: undefined;
	const maxDate = academicYear?.endDate
		? String(academicYear.endDate).split('T')[0]
		: undefined;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[540px]">
				<DialogHeader>
					<div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
						<CalendarOff className="h-5 w-5" />
						<DialogTitle className="text-xl">
							Declarar Día No Laborable / Suspensión de Clases
						</DialogTitle>
					</div>
					<DialogDescription>
						{academicYear ? `Ciclo Lectivo ${academicYear.year}. ` : ''}
						El día registrado no se contabilizará como hábil para asistencias.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Fecha de la suspensión / día no laborable</FormLabel>
									<FormControl>
										<Input type="date" min={minDate} max={maxDate} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Motivo de la suspensión</FormLabel>
									<FormControl>
										<Input
											placeholder="Ej: Paro docente provincial, Movilización gremial..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-1.5">
							<span className="text-xs text-muted-foreground font-medium">
								Motivos frecuentes:
							</span>
							<div className="flex flex-wrap gap-1.5">
								{COMMON_REASONS.map((r) => (
									<button
										key={r.label}
										type="button"
										onClick={() => {
											form.setValue('reason', r.label);
											form.setValue('type', r.type);
										}}
										className="text-[11px] px-2 py-0.5 rounded-full border bg-muted/60 hover:bg-muted text-foreground transition-colors"
									>
										{r.label}
									</button>
								))}
							</div>
						</div>

						<FormField
							control={form.control}
							name="notifySchool"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
									<div className="space-y-0.5 pr-2">
										<div className="flex items-center gap-1.5 font-medium text-sm">
											<Megaphone className="h-4 w-4 text-blue-500" />
											<FormLabel className="cursor-pointer">
												Emitir comunicado escolar a todo el colegio
											</FormLabel>
										</div>
										<FormDescription className="text-xs">
											Publica automáticamente un comunicado institucional dirigido a toda
											la comunidad educativa indicando la fecha y el motivo.
										</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						<Alert
							variant="default"
							className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
						>
							<AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
							<AlertTitle className="text-xs font-semibold">
								Impacto en asistencias
							</AlertTitle>
							<AlertDescription className="text-[11px] leading-relaxed">
								Al registrar este día, el sistema no computará inasistencias para los
								estudiantes ni docentes en esa jornada escolar.
							</AlertDescription>
						</Alert>

						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isLoading}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								variant="destructive"
								disabled={isLoading}
								className="gap-2"
							>
								<CalendarOff className="h-4 w-4" />
								{isLoading ? 'Registrando...' : 'Confirmar Suspensión'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
