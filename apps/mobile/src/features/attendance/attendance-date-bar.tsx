import DateTimePicker, {
	DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { parseDateString, toLocalDateString } from '../../lib/date';
import type { AttendanceDateNav } from './use-attendance-date';

// NativeWind: className stays static, dynamic state goes through inline style.
const DISABLED_OPACITY = 0.35;

// iOS dismisses its picker modal before an Alert can be presented.
const IOS_PICKER_CLOSE_DELAY_MS = 350;

/** `◀  Lun 06/10  ▶` plus a "Hoy" shortcut; tapping the date opens a calendar. */
export function AttendanceDateBar({ nav }: { nav: AttendanceDateNav }) {
	const [isIosPickerOpen, setIsIosPickerOpen] = useState(false);

	const pickerValue = parseDateString(nav.date) ?? new Date();
	const minimumDate = parseDateString(nav.earliest) ?? undefined;
	const maximumDate = parseDateString(nav.today) ?? undefined;

	const openPicker = () => {
		if (Platform.OS === 'android') {
			DateTimePickerAndroid.open({
				value: pickerValue,
				mode: 'date',
				minimumDate,
				maximumDate,
				onValueChange: (_event, picked) =>
					nav.selectDate(toLocalDateString(picked)),
			});
			return;
		}
		setIsIosPickerOpen(true);
	};

	return (
		<View className="mt-3 flex-row items-center">
			<View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50">
				<TouchableOpacity
					onPress={nav.goPrev}
					disabled={!nav.canGoPrev}
					accessibilityLabel="Día anterior"
					className="px-3 py-2"
					style={{ opacity: nav.canGoPrev ? 1 : DISABLED_OPACITY }}
				>
					<ChevronLeft size={18} color="#334155" />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={openPicker}
					accessibilityLabel="Elegir fecha"
					className="flex-row items-center px-2 py-2"
				>
					<Calendar size={14} color="#4F46E5" />
					<Text className="ml-1.5 text-sm font-bold text-slate-900">
						{nav.label}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={nav.goNext}
					disabled={!nav.canGoNext}
					accessibilityLabel="Día siguiente"
					className="px-3 py-2"
					style={{ opacity: nav.canGoNext ? 1 : DISABLED_OPACITY }}
				>
					<ChevronRight size={18} color="#334155" />
				</TouchableOpacity>
			</View>

			{nav.canGoToday ? (
				<TouchableOpacity
					onPress={nav.goToday}
					accessibilityLabel="Volver a hoy"
					className="ml-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 active:bg-indigo-100"
				>
					<Text className="text-xs font-bold text-indigo-700">Hoy</Text>
				</TouchableOpacity>
			) : null}

			{Platform.OS === 'ios' ? (
				<Modal
					visible={isIosPickerOpen}
					transparent
					animationType="fade"
					onRequestClose={() => setIsIosPickerOpen(false)}
				>
					<View
						className="flex-1 items-center justify-center px-6"
						style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
					>
						<View className="w-full rounded-2xl bg-white p-4">
							<DateTimePicker
								value={pickerValue}
								mode="date"
								display="inline"
								minimumDate={minimumDate}
								maximumDate={maximumDate}
								onValueChange={(_event, picked) => {
									setIsIosPickerOpen(false);
									const next = toLocalDateString(picked);
									setTimeout(() => nav.selectDate(next), IOS_PICKER_CLOSE_DELAY_MS);
								}}
							/>
							<TouchableOpacity
								onPress={() => setIsIosPickerOpen(false)}
								className="mt-2 items-center rounded-xl bg-slate-100 py-3"
							>
								<Text className="text-sm font-bold text-slate-700">Cancelar</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			) : null}
		</View>
	);
}
