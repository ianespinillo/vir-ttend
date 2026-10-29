/** Whether the class (theory or workshop) was marked as not held on a date. */
export interface SessionNotHeldStatus {
	notHeld: boolean;
	reason?: string;
}

/** Result of marking a class as not held: the records deleted for that day. */
export interface MarkSessionNotHeldResult {
	deletedRecords: number;
}
