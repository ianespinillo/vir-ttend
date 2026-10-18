import type { ITenantOption } from '@repo/common';

interface AuthPendingState {
	userId: string | null;
	tenants: ITenantOption[];
	isSuperAdmin: boolean;
}

const STORAGE_KEY = 'virttend_auth_pending';

const DEFAULT_STATE: AuthPendingState = {
	userId: null,
	tenants: [],
	isSuperAdmin: false,
};

let pendingState: AuthPendingState = { ...DEFAULT_STATE };

function loadFromStorage(): AuthPendingState | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (
			parsed &&
			typeof parsed.userId === 'string' &&
			Array.isArray(parsed.tenants)
		) {
			return parsed as AuthPendingState;
		}
	} catch {
		// Ignore storage parse errors
	}
	return null;
}

function saveToStorage(state: AuthPendingState): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Ignore storage write errors
	}
}

function clearStorage(): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// Ignore storage remove errors
	}
}

export const authPendingStore = {
	get: (): AuthPendingState => {
		if (!pendingState.userId) {
			const restored = loadFromStorage();
			if (restored) {
				pendingState = restored;
			}
		}
		return pendingState;
	},
	set: (next: Partial<AuthPendingState>) => {
		pendingState = { ...pendingState, ...next };
		saveToStorage(pendingState);
	},
	clear: () => {
		pendingState = { ...DEFAULT_STATE };
		clearStorage();
	},
};
