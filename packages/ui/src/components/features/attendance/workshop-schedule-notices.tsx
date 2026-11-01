'use client';

import { CalendarX } from 'lucide-react';

export const WORKSHOP_NOT_SCHEDULED_MESSAGE = 'No corresponde taller este día';

/** Replaces the "not held" action on a day the commission has no workshop. */
export function WorkshopNotScheduledMessage() {
	return (
		<span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
			<CalendarX className="h-4 w-4 shrink-0" />
			{WORKSHOP_NOT_SCHEDULED_MESSAGE}
		</span>
	);
}

export interface WorkshopNoScheduleBannerProps {
	/** Where the course schedule is loaded; the link is omitted when absent. */
	scheduleHref?: string;
}

/**
 * Shown when the commission has no workshop schedule loaded: the days with
 * workshop are unknown, so nothing is hidden.
 */
export function WorkshopNoScheduleBanner({
	scheduleHref,
}: Readonly<WorkshopNoScheduleBannerProps>) {
	return (
		<output className="block rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
			Esta comisión no tiene el horario de taller cargado, por eso el sistema no
			puede saber qué días hay taller. Cargá el horario del curso para que se
			indique cuándo corresponde.{' '}
			{scheduleHref && (
				<a href={scheduleHref} className="font-medium underline">
					Ir al horario del curso
				</a>
			)}
		</output>
	);
}
