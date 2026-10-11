import axios from 'axios';
import type { OutboxRecord } from '../offline/outbox-types';
import type { AttendanceRecordItem, RecordedAttendanceStatus } from './types';

/**
 * Pure helpers for justifying absences. No React and no storage, so the rules
 * (who may justify, when, what is sent) stay easy to reason about.
 */

/** Same preset reasons as the web justification modal. */
export const JUSTIFICATION_PRESET_REASONS = [
	'Certificado médico',
	'Motivos personales / familiares',
	'Trámite personal',
	'Problema de transporte',
	'Licencia escolar',
	'Otro',
] as const;

export const OTHER_REASON = 'Otro';
export const MAX_REASON_LENGTH = 500;
export const MAX_NOTES_LENGTH = 500;

export const HINT_OFFLINE = 'Necesitás conexión para justificar';
export const HINT_OUTBOX =
	'Esperá a que se sincronice la asistencia del día para justificar';
export const FALLBACK_JUSTIFY_ERROR =
	'No se pudo justificar la inasistencia. Intentá nuevamente.';
export const OFFLINE_JUSTIFY_ERROR =
	'No hay conexión con el servidor. Intentá nuevamente.';

export interface JustifyInput {
	/** Selected preset chip, or null when none is selected. */
	preset: string | null;
	/** Free text, only used with the "Otro" preset. */
	customReason: string;
	notes: string;
}

export interface JustifyPayload {
	reason: string;
	notes?: string;
}

/** Final reason text, or null while it is missing or too long. */
export const resolveReason = (
	preset: string | null,
	customReason: string,
): string | null => {
	const reason = (preset === OTHER_REASON ? customReason : preset)?.trim();
	if (!reason || reason.length > MAX_REASON_LENGTH) return null;
	return reason;
};

/** Request body for `POST /attendance/:id/justify`, or null when invalid. */
export const buildJustifyPayload = (
	input: JustifyInput,
): JustifyPayload | null => {
	const reason = resolveReason(input.preset, input.customReason);
	if (!reason) return null;
	const notes = input.notes.trim();
	if (notes.length > MAX_NOTES_LENGTH) return null;
	return notes ? { reason, notes } : { reason };
};

/** Only preceptors justify (the API also allows admins, who cannot use mobile). */
export const isPreceptorRole = (role: string | undefined): boolean =>
	role?.toLowerCase() === 'preceptor';

/**
 * Why justifying is blocked right now, shown once per sheet. Justifying is
 * online-only: the record id exists only after sync and the endpoint is not
 * idempotent, so it must never be queued. A pending/syncing/failed outbox item
 * for the day also blocks it, because the cached record ids may be stale.
 */
export const getJustifyBlockHint = (input: {
	online: boolean;
	hasOutboxItem: boolean;
}): string | null => {
	if (input.hasOutboxItem) return HINT_OUTBOX;
	if (!input.online) return HINT_OFFLINE;
	return null;
};

/**
 * "Justificar" is offered on rows the server stores as absent and the user has
 * not edited locally. Rows without a record id are offered but disabled.
 */
export const getJustifyRowState = (input: {
	isPreceptor: boolean;
	savedStatus: RecordedAttendanceStatus | undefined;
	localStatus: RecordedAttendanceStatus | undefined;
	recordId: string | undefined;
	blockHint: string | null;
}): { visible: boolean; enabled: boolean } => {
	const visible =
		input.isPreceptor &&
		input.savedStatus === 'absent' &&
		input.localStatus === 'absent';
	return {
		visible,
		enabled: visible && Boolean(input.recordId) && input.blockHint === null,
	};
};

/**
 * Records to send when saving a sheet. `justified` rows are never written by
 * mobile: the status belongs to the justification, and replaying a stale
 * `justified` (or overwriting it with `present`) would corrupt it.
 */
export const toSavableRecords = (
	statusByStudent: Readonly<Record<string, RecordedAttendanceStatus>>,
): OutboxRecord[] => {
	const records: OutboxRecord[] = [];
	for (const [studentId, status] of Object.entries(statusByStudent)) {
		if (status === 'justified') continue;
		records.push({ studentId, status });
	}
	return records;
};

/** Marks every student `present`, leaving justified students untouched. */
export const markAllPresentKeepingJustified = (
	studentIds: readonly string[],
	current: Readonly<Record<string, RecordedAttendanceStatus>>,
): Record<string, RecordedAttendanceStatus> => {
	const next: Record<string, RecordedAttendanceStatus> = {};
	for (const id of studentIds) {
		next[id] = current[id] === 'justified' ? 'justified' : 'present';
	}
	return next;
};

/** Cached day records after a successful justification of `recordId`. */
export const applyJustification = (
	records: readonly AttendanceRecordItem[],
	recordId: string,
	payload: JustifyPayload,
): AttendanceRecordItem[] =>
	records.map((record) =>
		record.id === recordId
			? {
					...record,
					status: 'justified',
					justification: {
						id: record.justification?.id ?? '',
						reason: payload.reason,
						notes: payload.notes,
					},
				}
			: record,
	);

/** First and last day (`YYYY-MM-DD`) of the month of a `YYYY-MM-DD` date. */
export const monthRangeOf = (date: string): { from: string; to: string } => {
	const [year, month] = date.split('-').map(Number);
	const lastDay = new Date(year, month, 0).getDate();
	const prefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
	return {
		from: `${prefix}-01`,
		to: `${prefix}-${String(lastDay).padStart(2, '0')}`,
	};
};

/** Justified records of a history payload, oldest first. */
export const selectJustifiedRecords = (
	history: readonly AttendanceRecordItem[],
): AttendanceRecordItem[] =>
	history
		.filter(
			(record) => record.status === 'justified' || Boolean(record.justification),
		)
		.sort(
			(a, b) =>
				(a.date ?? '').slice(0, 10).localeCompare((b.date ?? '').slice(0, 10)) ||
				(a.studentName ?? '').localeCompare(b.studentName ?? ''),
		);

/** `dd/MM/yyyy` from an ISO date or `YYYY-MM-DD`; `-` when missing. */
export const formatRecordDate = (value: string | undefined): string => {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
	return match ? `${match[3]}/${match[2]}/${match[1]}` : '-';
};

/** Server message when there is one, a Spanish fallback otherwise. */
export const getJustifyErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		if (!error.response) return OFFLINE_JUSTIFY_ERROR;
		const message = (
			error.response.data as { message?: string | string[] } | undefined
		)?.message;
		if (Array.isArray(message) && message.length > 0) return message.join(', ');
		if (typeof message === 'string' && message.trim()) return message;
	}
	return FALLBACK_JUSTIFY_ERROR;
};
