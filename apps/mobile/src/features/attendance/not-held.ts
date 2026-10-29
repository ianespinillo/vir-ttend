import axios from 'axios';

/**
 * Pure copy and helpers for the "class not held" marker. Same wording as the
 * web controls; no React and no storage.
 */

export type NotHeldKind = 'theory' | 'workshop';

export const MAX_NOT_HELD_REASON_LENGTH = 500;

export const NOT_HELD_COPY = {
	theory: {
		action: 'Clase no dictada',
		title: 'Clase no dictada',
		noticeDescription:
			'Este día no se dictó la clase: no se registra asistencia ni cuentan inasistencias.',
		unmark: 'Habilitar asistencia',
		unmarkTitle: 'Habilitar asistencia',
		unmarkMessage:
			'La clase se va a marcar como dictada y se podrá tomar asistencia de este día.',
		lookupError: 'No se pudo verificar si la clase se dictó.',
	},
	workshop: {
		action: 'Taller no dictado',
		title: 'Taller no dictado',
		noticeDescription:
			'Este día no se dictó el taller: no se registra asistencia ni cuentan inasistencias.',
		unmark: 'Habilitar asistencia',
		unmarkTitle: 'Habilitar asistencia',
		unmarkMessage:
			'El taller se va a marcar como dictado y se podrá tomar asistencia de este día.',
		lookupError: 'No se pudo verificar si el taller se dictó.',
	},
} as const;

export const HINT_NOT_HELD_OFFLINE = 'Necesitás conexión para marcar el día';
export const FALLBACK_NOT_HELD_ERROR =
	'No se pudo actualizar el día. Intentá nuevamente.';
export const OFFLINE_NOT_HELD_ERROR =
	'No hay conexión con el servidor. Intentá nuevamente.';

/** Warning shown before marking: saved records of the day get deleted. */
export const formatNotHeldWarning = (savedRecordsCount: number): string => {
	if (savedRecordsCount <= 0) return 'Este día no se va a registrar asistencia.';
	return savedRecordsCount === 1
		? 'Se va a borrar 1 registro de asistencia de este día.'
		: `Se van a borrar ${savedRecordsCount} registros de asistencia de este día.`;
};

/** Optional reason: blank becomes `undefined` so it is not sent. */
export const normalizeNotHeldReason = (reason: string): string | undefined =>
	reason.trim() || undefined;

export const getNotHeldErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		if (!error.response) return OFFLINE_NOT_HELD_ERROR;
		const message = (
			error.response.data as { message?: string | string[] } | undefined
		)?.message;
		if (Array.isArray(message) && message.length > 0) return message.join(', ');
		if (typeof message === 'string' && message.trim()) return message;
	}
	return FALLBACK_NOT_HELD_ERROR;
};
