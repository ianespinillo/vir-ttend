import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CloudOff, FileCheck, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
	ActivityIndicator,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsOnline } from '../offline/use-is-online';
import {
	formatRecordDate,
	monthRangeOf,
	selectJustifiedRecords,
} from './justification';
import { attendanceQueries } from './queries';

const MONTH_NAMES = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre',
];

const monthLabelOf = (date: string): string => {
	const [year, month] = date.split('-').map(Number);
	return `${MONTH_NAMES[month - 1] ?? ''} ${year}`.trim();
};

interface Props {
	visible: boolean;
	onClose: () => void;
	courseId: string;
	courseName?: string;
	/** Any day (`YYYY-MM-DD`) of the month to list. */
	date: string;
}

/**
 * Read-only list of the month's justified records of a course (mirrors the
 * web "Justificaciones del Curso" modal). Fetched online with React Query;
 * when offline it shows whatever the persisted cache already holds.
 */
export function MonthlyJustificationsModal({
	visible,
	onClose,
	courseId,
	courseName,
	date,
}: Props) {
	const online = useIsOnline();
	const { from, to } = useMemo(() => monthRangeOf(date), [date]);
	const monthLabel = monthLabelOf(date);

	const { data, isLoading, isError, fetchStatus } = useQuery({
		...attendanceQueries.courseHistory(courseId, from, to),
		enabled: visible && !!courseId,
	});

	const justified = useMemo(() => selectJustifiedRecords(data ?? []), [data]);
	const offlineWithoutData = data === undefined && fetchStatus === 'paused';

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<SafeAreaView className="flex-1 bg-slate-50">
				<View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
					<View className="flex-1 pr-3">
						<View className="flex-row items-center">
							<FileCheck size={18} color="#4F46E5" />
							<Text className="ml-2 text-lg font-bold text-slate-900">
								Justificaciones del mes
							</Text>
						</View>
						<Text className="mt-0.5 text-xs text-slate-500">
							{courseName ? `${courseName} · ` : ''}
							{monthLabel}
						</Text>
					</View>
					<TouchableOpacity
						onPress={onClose}
						className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
					>
						<X size={18} color="#475569" />
					</TouchableOpacity>
				</View>

				{!online && data !== undefined ? (
					<View className="mx-5 mt-3 flex-row items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
						<CloudOff size={14} color="#B45309" />
						<Text className="ml-2 flex-1 text-xs text-amber-800">
							Sin conexión. Mostrando datos guardados en el dispositivo.
						</Text>
					</View>
				) : null}

				{isLoading && !offlineWithoutData ? (
					<View className="flex-1 items-center justify-center">
						<ActivityIndicator size="large" color="#4F46E5" />
						<Text className="mt-3 text-sm text-slate-500">
							Cargando justificaciones del mes...
						</Text>
					</View>
				) : offlineWithoutData ? (
					<View className="flex-1 items-center justify-center px-6">
						<CloudOff size={36} color="#94A3B8" />
						<Text className="mt-2 text-center text-sm font-medium text-slate-700">
							Sin conexión. Todavía no hay justificaciones descargadas para este mes.
						</Text>
					</View>
				) : isError && data === undefined ? (
					<View className="flex-1 items-center justify-center px-6">
						<AlertCircle size={36} color="#EF4444" />
						<Text className="mt-2 text-center text-sm font-medium text-slate-700">
							No se pudieron cargar las justificaciones.
						</Text>
					</View>
				) : justified.length === 0 ? (
					<View className="flex-1 items-center justify-center px-6">
						<FileCheck size={36} color="#94A3B8" />
						<Text className="mt-2 text-base font-semibold text-slate-700">
							Sin justificaciones
						</Text>
						<Text className="mt-1 text-center text-xs text-slate-500">
							No se encontraron asistencias justificadas para este curso en{' '}
							{monthLabel}.
						</Text>
					</View>
				) : (
					<ScrollView className="flex-1 px-4 py-3">
						{justified.map((record, index) => (
							<View
								key={record.id ?? `${record.studentId}-${index}`}
								className="mb-2.5 rounded-xl border border-slate-200 bg-white p-3.5"
							>
								<Text className="text-sm font-semibold text-slate-900">
									{record.studentName ?? 'Alumno'}
								</Text>
								<Text className="mt-0.5 text-xs text-slate-500">
									Fecha de inasistencia: {formatRecordDate(record.date)}
								</Text>
								<Text className="mt-2 text-xs font-semibold text-slate-800">
									Motivo:{' '}
									<Text className="font-normal text-slate-600">
										{record.justification?.reason || 'No especificado'}
									</Text>
								</Text>
								{record.justification?.notes ? (
									<Text className="mt-1.5 rounded-md bg-slate-100 p-2 text-xs italic text-slate-600">
										"{record.justification.notes}"
									</Text>
								) : null}
							</View>
						))}
						<View className="h-6" />
					</ScrollView>
				)}
			</SafeAreaView>
		</Modal>
	);
}
