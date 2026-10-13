import { formatDayMonthTime } from '../../lib/date';
import type { PreloadStatus } from './preload-service';
import type { ServerReachability } from './server-reachability';

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
	outboxPendingCount?: number;
	/** Items that failed transiently and are queued for another attempt. */
	outboxRetryingCount?: number;
	outboxErrorCount?: number;
	isOutboxSyncing?: boolean;
	/** Whether the API answers; only matters while the device is online. */
	serverStatus?: ServerReachability;
}): SyncDescription => {
	const {
		online,
		status,
		lastSyncedAt,
		outboxPendingCount = 0,
		outboxRetryingCount = 0,
		outboxErrorCount = 0,
		isOutboxSyncing = false,
		serverStatus = 'unknown',
	} = input;
	const syncedLabel =
		lastSyncedAt === null ? null : formatDayMonthTime(lastSyncedAt);

	// Retrying items are not synced yet either: they count as unsent changes.
	const unsentCount = outboxPendingCount + outboxRetryingCount;

	if (!online) {
		if (unsentCount > 0) {
			const label =
				unsentCount === 1
					? '1 cambio pendiente'
					: `${unsentCount} cambios pendientes`;
			return {
				tone: 'offline',
				text: `Sin conexión · ${label}`,
			};
		}
		return {
			tone: 'offline',
			text: syncedLabel
				? `Sin conexión · datos del ${syncedLabel}`
				: 'Sin conexión · sin datos guardados',
		};
	}

	// Online but the server does not answer: say so instead of an endless
	// "Sincronizando…" (shares the amber tone of the offline state).
	if (serverStatus === 'unreachable') {
		const parts = ['No se puede conectar con el servidor'];
		if (unsentCount > 0) {
			parts.push(
				unsentCount === 1
					? '1 cambio pendiente'
					: `${unsentCount} cambios pendientes`,
			);
		}
		parts.push('reintentando');
		return { tone: 'offline', text: parts.join(' · ') };
	}

	if (isOutboxSyncing || status === 'running') {
		return {
			tone: 'syncing',
			text: isOutboxSyncing ? 'Sincronizando cambios…' : 'Sincronizando datos…',
		};
	}

	if (outboxErrorCount > 0) {
		const label =
			outboxErrorCount === 1
				? '1 cambio con error'
				: `${outboxErrorCount} cambios con error`;
		return {
			tone: 'error',
			text: `Error de sincronización · ${label}`,
		};
	}

	if (unsentCount > 0) {
		const label =
			unsentCount === 1
				? '1 cambio pendiente de sincronizar'
				: `${unsentCount} cambios pendientes de sincronizar`;
		return {
			tone: 'syncing',
			text: outboxRetryingCount > 0 ? `${label} · reintentando` : label,
		};
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
