import { CloudOff, RefreshCw } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { usePreload } from './preload-provider';
import { type SyncTone, describeSyncStatus } from './sync-status';
import { useIsOnline } from './use-is-online';

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
	const { status, lastSyncedAt } = usePreload();
	const { tone, text } = describeSyncStatus({ online, status, lastSyncedAt });
	const colors = toneColors[tone];
	const Icon = tone === 'offline' ? CloudOff : RefreshCw;

	return (
		<View
			className="mb-4 flex-row items-center self-start rounded-full border px-3 py-1.5"
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
	);
}
