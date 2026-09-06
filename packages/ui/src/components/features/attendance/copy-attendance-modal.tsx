'use client';

import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
} from '@repo/common';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
	CheckCircle2,
	Clock,
	Copy,
	FileCheck2,
	Loader2,
	XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../ui/button';
import { Calendar } from '../../../ui/calendar';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';
import { Skeleton } from '../../../ui/skeleton';

export interface CopyAttendanceModalProps {
	isOpen: boolean;
	onClose: () => void;
	subjectName?: string;
	targetDate: string;
	sourceDate?: string;
	onSourceDateChange?: (date: string) => void;
	previewRecords?: AttendanceRecord[];
	isLoadingPreview?: boolean;
	onConfirm: (sourceDate?: string) => Promise<void>;
	isSubmitting?: boolean;
}

const statusConfig: Record<
	AttendanceStatus,
	{ label: string; icon: typeof CheckCircle2; className: string }
> = {
	[ATTENDANCE_STATUS.PRESENT]: {
		label: 'Presente',
		icon: CheckCircle2,
		className:
			'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
	},
	[ATTENDANCE_STATUS.ABSENT]: {
		label: 'Ausente',
		icon: XCircle,
		className:
			'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
	},
	[ATTENDANCE_STATUS.LATE]: {
		label: 'Tarde',
		icon: Clock,
		className:
			'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
	},
	[ATTENDANCE_STATUS.JUSTIFIED]: {
		label: 'Justificado',
		icon: FileCheck2,
		className:
			'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
	},
};

function StatusBadge({ status }: Readonly<{ status: AttendanceStatus }>) {
	const [config, setConfig] = useState({
		label: 'Sin registro',
		icon: CheckCircle2,
		className: 'bg-muted/10 text-muted-foreground border-muted/30',
	});
	const [Icon, setIcon] = useState<typeof CheckCircle2>(
		status ? statusConfig[status].icon : CheckCircle2,
	);
	useEffect(() => {
		if (status) {
			setConfig(statusConfig[status]);
			setIcon(statusConfig[status].icon);
		}
	}, [status]);
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
				config.className,
			)}
		>
			<Icon className="h-3 w-3 shrink-0" />
			{config.label}
		</span>
	);
}

export function CopyAttendanceModal({
	isOpen,
	onClose,
	subjectName,
	targetDate,
	sourceDate,
	onSourceDateChange,
	previewRecords,
	isLoadingPreview,
	onConfirm,
	isSubmitting,
}: Readonly<CopyAttendanceModalProps>) {
	console.log(previewRecords);
	const [step, setStep] = useState<'select' | 'preview'>(
		sourceDate ? 'preview' : 'select',
	);
	const [localSourceDate, setLocalSourceDate] = useState<string | undefined>(
		sourceDate,
	);
	const [calendarOpen, setCalendarOpen] = useState(false);

	const handleClose = () => {
		setStep(sourceDate ? 'preview' : 'select');
		setLocalSourceDate(sourceDate);
		onClose();
	};

	const handleDateSelect = (date: Date | undefined) => {
		if (!date) return;
		const formatted = format(date, 'yyyy-MM-dd');
		setLocalSourceDate(formatted);
		onSourceDateChange?.(formatted);
		setStep('preview');
		setCalendarOpen(false);
	};

	const handleConfirm = async () => {
		await onConfirm(localSourceDate);
		handleClose();
	};

	const handleBack = () => {
		setStep('select');
	};

	const sourceDateObj = localSourceDate ? parseISO(localSourceDate) : undefined;
	const hasPreview = previewRecords && previewRecords.length > 0;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Copy className="h-5 w-5 text-primary shrink-0" />
						Copiar Asistencia
					</DialogTitle>
					<DialogDescription>
						{step === 'select'
							? 'Selecciona la fecha de la cual deseas copiar la asistencia.'
							: `Copiando asistencia del ${localSourceDate} para ${subjectName || 'el curso'} a la fecha ${targetDate}.`}
					</DialogDescription>
				</DialogHeader>

				{step === 'select' && (
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<p className="text-sm font-medium text-foreground">Fecha origen</p>
							<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-start text-left font-normal"
									>
										{sourceDateObj ? (
											<span className="capitalize">
												{format(sourceDateObj, "EEEE d 'de' MMMM, yyyy", {
													locale: es,
												})}
											</span>
										) : (
											<span className="text-muted-foreground">Seleccionar fecha</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={sourceDateObj ?? new Date()}
										onSelect={handleDateSelect}
										disabled={(date) => {
											const day = date.getDay();
											const isWeekend = day === 0 || day === 6;
											const isFuture = date > new Date();
											const isSameAsTarget = format(date, 'yyyy-MM-dd') === targetDate;
											return isWeekend || isFuture || isSameAsTarget;
										}}
										initialFocus
										locale={es}
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				)}

				{step === 'preview' && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								<span className="font-medium text-foreground">Fecha origen:</span>{' '}
								<span className="capitalize">
									{localSourceDate &&
										format(parseISO(localSourceDate), "EEEE d 'de' MMMM", {
											locale: es,
										})}
								</span>
							</div>
							{onSourceDateChange && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleBack}
									className="text-xs h-7"
								>
									Cambiar fecha
								</Button>
							)}
						</div>

						<div className="border border-border/60 rounded-lg overflow-hidden">
							<div className="max-h-64 overflow-y-auto">
								{isLoadingPreview ? (
									<div className="p-4 space-y-3">
										{[1, 2, 3, 4, 5].map((i) => (
											<div key={i} className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Skeleton className="h-7 w-7 rounded-full" />
													<Skeleton className="h-4 w-32" />
												</div>
												<Skeleton className="h-5 w-20 rounded-md" />
											</div>
										))}
									</div>
								) : hasPreview ? (
									<ul className="divide-y divide-border/50">
										{previewRecords?.map((record) => (
											<li
												key={record.studentId}
												className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors"
											>
												<span className="text-sm font-medium text-foreground truncate">
													{record.studentName}
												</span>
												<StatusBadge status={record.status} />
											</li>
										))}
									</ul>
								) : (
									<div className="p-6 text-center text-sm text-muted-foreground">
										No hay registros para esta fecha.
									</div>
								)}
							</div>
						</div>

						<p className="text-xs text-muted-foreground">
							<strong>Nota:</strong> Los registros que ya fueron completados para la
							fecha destino NO se sobrescribirán.
						</p>
					</div>
				)}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isSubmitting}
					>
						Cancelar
					</Button>
					{step === 'preview' && (
						<Button
							type="button"
							onClick={handleConfirm}
							disabled={isSubmitting || !hasPreview || isLoadingPreview}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
									Copiando...
								</>
							) : (
								'Confirmar Copia'
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
