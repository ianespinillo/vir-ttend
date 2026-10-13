import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import {
	type FailedItemInfo,
	describeFailedItem,
	selectPermanentFailures,
} from './outbox-display';
import { useOutbox } from './use-outbox';

// NativeWind: className stays static, colors go through inline style.
const RED = {
	background: '#FEF2F2',
	border: '#FECACA',
	title: '#991B1B',
	text: '#B91C1C',
};

/**
 * Lists attendance saves that the server rejected permanently, for ANY date
 * (the per-card badge only covers today). Each one can be retried or discarded.
 */
export function FailedSyncBanner() {
	const { items, retryItem, removeItem } = useOutbox();
	const [expanded, setExpanded] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	const failures = useMemo(
		() => selectPermanentFailures(items).map(describeFailedItem),
		[items],
	);

	if (failures.length === 0) return null;

	const runAction = async (id: string, action: () => Promise<void>) => {
		setBusyId(id);
		try {
			await action();
		} catch {
			Alert.alert('Error', 'No se pudo completar la acción. Intentá nuevamente.');
		} finally {
			setBusyId(null);
		}
	};

	const confirmDiscard = (failure: FailedItemInfo) => {
		Alert.alert(
			'Descartar lista',
			`Se perderán los cambios de ${failure.title} del ${failure.date}. Esta acción no se puede deshacer.`,
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Descartar',
					style: 'destructive',
					onPress: () => void runAction(failure.id, () => removeItem(failure.id)),
				},
			],
		);
	};

	const title =
		failures.length === 1
			? '1 lista no se pudo sincronizar'
			: `${failures.length} listas no se pudieron sincronizar`;

	return (
		<View
			className="mb-4 rounded-xl border p-3"
			style={{ backgroundColor: RED.background, borderColor: RED.border }}
		>
			<TouchableOpacity
				onPress={() => setExpanded((value) => !value)}
				className="flex-row items-center"
			>
				<AlertCircle size={15} color={RED.text} />
				<Text
					className="ml-2 flex-1 text-xs font-bold"
					style={{ color: RED.title }}
				>
					{title}
				</Text>
				{expanded ? (
					<ChevronUp size={16} color={RED.text} />
				) : (
					<ChevronDown size={16} color={RED.text} />
				)}
			</TouchableOpacity>

			{expanded
				? failures.map((failure) => (
						<View
							key={failure.id}
							className="mt-3 border-t pt-3"
							style={{ borderColor: RED.border }}
						>
							<Text className="text-xs font-bold" style={{ color: RED.title }}>
								{failure.title}
							</Text>
							<Text className="mt-0.5 text-[11px]" style={{ color: RED.text }}>
								{failure.kind} · {failure.date}
							</Text>
							<Text className="mt-1 text-[11px]" style={{ color: RED.text }}>
								{failure.message}
							</Text>
							<View className="mt-2 flex-row">
								<TouchableOpacity
									disabled={busyId !== null}
									onPress={() => void runAction(failure.id, () => retryItem(failure.id))}
									className="mr-2 rounded-lg bg-white px-3 py-1.5 active:bg-red-100"
									style={{ opacity: busyId === null ? 1 : 0.5 }}
								>
									<Text className="text-xs font-semibold text-primary-700">
										Reintentar
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									disabled={busyId !== null}
									onPress={() => confirmDiscard(failure)}
									className="rounded-lg bg-white px-3 py-1.5 active:bg-red-100"
									style={{ opacity: busyId === null ? 1 : 0.5 }}
								>
									<Text className="text-xs font-semibold text-red-700">Descartar</Text>
								</TouchableOpacity>
							</View>
						</View>
					))
				: null}
		</View>
	);
}
