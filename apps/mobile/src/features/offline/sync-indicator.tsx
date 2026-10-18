import { AlertCircle, CloudOff, RefreshCw } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import type { StatusTone, ThemePalette } from '../theme/theme-tokens';
import { useThemeColors } from '../theme/use-theme-colors';
import { usePreload } from './preload-provider';
import { type SyncTone, describeSyncStatus } from './sync-status';
import { useIsOnline } from './use-is-online';
import { useOutbox } from './use-outbox';
import { useServerReachability } from './use-server-reachability';

type ToneColors = Pick<StatusTone, 'background' | 'border' | 'text'>;

const strong = ({
	background,
	border,
	strongText,
}: StatusTone): ToneColors => ({
	background,
	border,
	text: strongText,
});

// NativeWind: className stays static, the tone is applied through inline style.
const toneColorsFor = (theme: ThemePalette): Record<SyncTone, ToneColors> => ({
	offline: strong(theme.status.warning),
	syncing: strong(theme.status.justified),
	ok: strong(theme.status.success),
	error: strong(theme.status.danger),
	idle: theme.neutralTone,
});

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
	const colors = toneColorsFor(useThemeColors())[tone];
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
				<Text className="mt-1.5 text-[11px] text-muted-foreground">
					¿Está activo `adb reverse tcp:3001 tcp:3001`? (pnpm android:reverse)
				</Text>
			) : null}
		</View>
	);
}
