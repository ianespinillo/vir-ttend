import type { ITenantOption } from '@repo/common';

interface AuthPendingState {
	userId: string | null;
	tenants: ITenantOption[];
	isSuperAdmin: boolean;
}

let pendingState: AuthPendingState = {
	userId: null,
	tenants: [],
	isSuperAdmin: false,
};

export const authPendingStore = {
	get: () => pendingState,
	set: (next: Partial<AuthPendingState>) => {
		pendingState = { ...pendingState, ...next };
	},
	clear: () => {
		pendingState = { userId: null, tenants: [], isSuperAdmin: false };
	},
};
