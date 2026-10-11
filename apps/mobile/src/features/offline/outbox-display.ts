import { isPermanentFailure } from '../attendance/taken';
import type { OutboxItem } from './outbox-types';

export type OutboxBadgeTone = 'error' | 'pending';

export interface OutboxBadge {
	tone: OutboxBadgeTone;
	/** User-facing copy (Spanish). */
	label: string;
}

/** Badge shown on a home card for the outbox item of that course/subject. */
export const describeOutboxBadge = (
	item: Pick<OutboxItem, 'status' | 'error'>,
): OutboxBadge => {
	if (isPermanentFailure(item)) {
		return { tone: 'error', label: 'Error de sincronización' };
	}
	if (item.status === 'syncing') {
		return { tone: 'pending', label: 'Sincronizando…' };
	}
	if (item.status === 'failed') {
		return { tone: 'pending', label: 'Reintentando…' };
	}
	return { tone: 'pending', label: 'Pendiente de sincronizar' };
};

/** Permanently failed items of ANY date, newest day first. */
export const selectPermanentFailures = (
	items: readonly OutboxItem[],
): OutboxItem[] =>
	items
		.filter((item) => isPermanentFailure(item))
		.sort((a, b) =>
			a.date === b.date ? b.updatedAt - a.updatedAt : b.date.localeCompare(a.date),
		);

/** `2026-10-11` -> `11/10/2026`; unknown shapes are returned untouched. */
export const formatOutboxDate = (date: string): string => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
	return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
};

export interface FailedItemInfo {
	id: string;
	title: string;
	kind: string;
	date: string;
	message: string;
}

/** Compact row data for the failed-sync list on home. */
export const describeFailedItem = (item: OutboxItem): FailedItemInfo => {
	const title =
		item.type === 'subject'
			? [item.subjectName ?? 'Materia', item.courseName]
					.filter(Boolean)
					.join(' · ')
			: (item.courseName ?? 'Curso');
	return {
		id: item.id,
		title,
		kind:
			item.type === 'subject' ? 'Asistencia por materia' : 'Asistencia diaria',
		date: formatOutboxDate(item.date),
		message: item.error?.message ?? 'Error desconocido',
	};
};
