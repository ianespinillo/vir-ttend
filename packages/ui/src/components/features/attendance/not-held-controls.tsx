'use client';

import { CalendarOff } from 'lucide-react';
import { useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../../../ui/alert-dialog';
import { Button } from '../../../ui/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '../../../ui/empty';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';

/** The class (theory or workshop) was marked as not held on the selected date. */
export interface NotHeldState {
	reason?: string;
}

/**
 * Status of the not-held lookup while it cannot be trusted: absent means known
 * (held or not held), so existing usages keep rendering as before.
 */
export type NotHeldLookupStatus = 'loading' | 'error';

export type NotHeldKind = 'theory' | 'workshop';

const COPY = {
	theory: {
		action: 'Clase no dictada',
		title: 'Marcar la clase como no dictada',
		noticeTitle: 'Clase no dictada',
		noticeDescription:
			'Este día no se dictó la clase: no se registra asistencia ni cuentan inasistencias.',
		unmark: 'Marcar como dictada',
	},
	workshop: {
		action: 'Taller no dictado',
		title: 'Marcar el taller como no dictado',
		noticeTitle: 'Taller no dictado',
		noticeDescription:
			'Este día no se dictó el taller: no se registra asistencia ni cuentan inasistencias.',
		unmark: 'Marcar como dictado',
	},
} as const;

export function formatDeletedRecordsWarning(count: number): string {
	return count === 1
		? 'Se va a borrar 1 registro de asistencia de este día.'
		: `Se van a borrar ${count} registros de asistencia de este día.`;
}

export interface MarkNotHeldButtonProps {
	kind: NotHeldKind;
	/** Attendance already saved for the day; it is deleted when marking. */
	savedRecordsCount: number;
	onConfirm: (reason?: string) => void;
	disabled?: boolean;
}

/** "Not held" action with a confirmation dialog and an optional reason. */
export function MarkNotHeldButton({
	kind,
	savedRecordsCount,
	onConfirm,
	disabled,
}: Readonly<MarkNotHeldButtonProps>) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState('');
	const copy = COPY[kind];

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled}
				onClick={() => {
					setReason('');
					setOpen(true);
				}}
				className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-500/20 shadow-xs"
			>
				<CalendarOff className="mr-1.5 h-4 w-4 shrink-0" />
				{copy.action}
			</Button>
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{copy.title}</AlertDialogTitle>
						<AlertDialogDescription>
							{savedRecordsCount > 0
								? formatDeletedRecordsWarning(savedRecordsCount)
								: 'Este día no se va a registrar asistencia.'}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-2">
						<Label htmlFor="not-held-reason">Motivo (opcional)</Label>
						<Textarea
							id="not-held-reason"
							value={reason}
							maxLength={500}
							onChange={(event) => setReason(event.target.value)}
							placeholder="Ej: docente ausente"
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={() => onConfirm(reason.trim() || undefined)}>
							Confirmar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export interface NotHeldNoticeProps {
	kind: NotHeldKind;
	reason?: string;
	onUnmark?: () => void;
	isPending?: boolean;
}

/** Replaces the attendance grid on a day marked as not held. */
export function NotHeldNotice({
	kind,
	reason,
	onUnmark,
	isPending,
}: Readonly<NotHeldNoticeProps>) {
	const copy = COPY[kind];

	return (
		<Empty className="my-8 border border-dashed border-border">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<CalendarOff className="h-6 w-6" />
				</EmptyMedia>
				<EmptyTitle>{copy.noticeTitle}</EmptyTitle>
				<EmptyDescription>{copy.noticeDescription}</EmptyDescription>
				{reason && <EmptyDescription>Motivo: {reason}</EmptyDescription>}
			</EmptyHeader>
			{onUnmark && (
				<EmptyContent>
					<Button
						type="button"
						variant="outline"
						onClick={onUnmark}
						disabled={isPending}
					>
						{copy.unmark}
					</Button>
				</EmptyContent>
			)}
		</Empty>
	);
}

export interface NotHeldLookupErrorProps {
	onRetry?: () => void;
}

/** Shown when it could not be verified whether the class was held. */
export function NotHeldLookupError({
	onRetry,
}: Readonly<NotHeldLookupErrorProps>) {
	return (
		<output className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			<span>No se pudo verificar si la clase se dictó.</span>
			{onRetry && (
				<Button type="button" variant="outline" size="sm" onClick={onRetry}>
					Reintentar
				</Button>
			)}
		</output>
	);
}
