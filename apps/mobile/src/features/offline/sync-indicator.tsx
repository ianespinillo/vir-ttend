import { AlertCircle, CloudOff, RefreshCw } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { usePreload } from './preload-provider';
import { type SyncTone, describeSyncStatus } from './sync-status';
import { useIsOnline } from './use-is-online';
import { useOutbox } from './use-outbox';
import { useServerReachability } from './use-server-reachability';

// NativeWind: className stays static, the tone is applied through inline style.
const toneColors: Record<
	SyncTone,
	{ background: string; border: string; text: string }
> = {
	offline: { background: '#FFFBEB', border: '#FDE68A', text: '#92400E' }, // amber
	syncing: { background: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' }, // indigo
	ok: { background: '#ECFDF5', border: '#A7F3D0', text: '#065F46' }, // emerald
	error: { background: '#FEF2F2', border: '#FECACA', text: '#991B1B' }, // red
	idle: { background: '#F1F5F9', border: '#E2E8F0', text: '#475569' }, // slate
};

/** Offline / last-synced pill shown on the home screen. */
export function SyncIndicator() {
	const online = useIsOnline();
	const serverStatus = useServerReachability();
	const { status, lastSyncedAt } = usePreload();
	const { pendingCount, retryingCount, errorCount, isSyncing } = useOutbox();
	const { tone, text } = describeSyncStatus({
		online,
		status,
		lastSyncedAt,
		outboxPendingCount: pendingCount,
		outboxRetryingCount: retryingCount,
		outboxErrorCount: errorCount,
		isOutboxSyncing: isSyncing,
		serverStatus,
	});
	const colors = toneColors[tone];
	const Icon =
		tone === 'offline' ? CloudOff : tone === 'error' ? AlertCircle : RefreshCw;

	// Development only: the usual cause is a missing USB tunnel to the API.
	const showDevHint = __DEV__ && online && serverStatus === 'unreachable';

	return (
		<View className="mb-4">
			<View
				className="flex-row items-center self-start rounded-full border px-3 py-1.5"
				style={{ backgroundColor: colors.background, borderColor: colors.border }}
			>
				<Icon size={13} color={colors.text} />
				<Text
					className="ml-1.5 text-xs font-semibold"
					style={{ color: colors.text }}
				>
					{text}
				</Text>
			</View>
			{showDevHint ? (
				<Text className="mt-1.5 text-[11px] text-slate-500">
					¿Está activo `adb reverse tcp:3001 tcp:3001`? (pnpm android:reverse)
				</Text>
			) : null}
		</View>
	);
}
