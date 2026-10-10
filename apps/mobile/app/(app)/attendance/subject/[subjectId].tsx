import { useLocalSearchParams } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

// Placeholder: the real screen (roster + status buttons + save) lands in T5b.
export default function SubjectAttendanceScreen() {
	const params = useLocalSearchParams();
	const name = typeof params.name === 'string' ? params.name : 'Materia';

	return (
		<View className="flex-1 items-center justify-center bg-slate-50 px-6">
			<BookOpen size={36} color="#94A3B8" />
			<Text className="mt-3 text-base font-semibold text-slate-700">{name}</Text>
			<Text className="mt-1 text-center text-xs text-slate-400">
				El pase de lista por materia estará disponible próximamente.
			</Text>
		</View>
	);
}
