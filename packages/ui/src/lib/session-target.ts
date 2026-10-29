/** A class session is identified by its course (or commission) and its date. */
export interface SessionTarget {
	id: string;
	date: string;
}

/**
 * Whether the current selection is still the session a request was made for.
 * Guards state resets that run after an async mark/unmark resolves.
 */
export function isSameSessionTarget(
	requested: SessionTarget,
	current: SessionTarget,
): boolean {
	return requested.id === current.id && requested.date === current.date;
}
