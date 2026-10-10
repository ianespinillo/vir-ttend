import { formatDayMonthTime } from '../../lib/date';
import type { PreloadStatus } from './preload-service';

export type SyncTone = 'offline' | 'syncing' | 'ok' | 'error' | 'idle';

export interface SyncDescription {
	tone: SyncTone;
	/** User-facing copy (Spanish). */
	text: string;
}

/** What the offline/last-synced indicator shows. Offline wins over everything. */
export const describeSyncStatus = (input: {
	online: boolean;
	status: PreloadStatus;
	lastSyncedAt: number | null;
}): SyncDescription => {
	const { online, status, lastSyncedAt } = input;
	const syncedLabel =
		lastSyncedAt === null ? null : formatDayMonthTime(lastSyncedAt);

	if (!online) {
		return {
			tone: 'offline',
			text: syncedLabel
				? `Sin conexión · datos del ${syncedLabel}`
				: 'Sin conexión · sin datos guardados',
		};
	}
	if (status === 'running') {
		return { tone: 'syncing', text: 'Sincronizando datos…' };
	}
	if (status === 'error') {
		return {
			tone: 'error',
			text: syncedLabel
				? `No se pudo sincronizar · datos del ${syncedLabel}`
				: 'No se pudo sincronizar los datos',
		};
	}
	if (syncedLabel) {
		return { tone: 'ok', text: `Datos sincronizados · ${syncedLabel}` };
	}
	return { tone: 'idle', text: 'Datos sin sincronizar' };
};
