import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
	BookOpen,
	Calendar,
	CheckCircle,
	ChevronRight,
	Clock,
	Users,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useAuth } from '../../src/context/auth-context';
import { api } from '../../src/services/api';

interface CourseItem {
	id: string;
	name: string;
	year?: number;
	division?: string;
	shift?: string;
	academicYearId?: string;
}

export default function HomeScreen() {
	const { user } = useAuth();
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);

	// Fetch courses
	const {
		data: coursesData,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['mobile-courses'],
		queryFn: async () => {
			const res = await api.get('/courses');
			return res.data?.data || res.data || [];
		},
	});

	const courses: CourseItem[] = Array.isArray(coursesData)
		? coursesData
		: coursesData?.items || [];

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	const todayFormatted = new Intl.DateTimeFormat('es-AR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	}).format(new Date());

	return (
		<ScrollView
			className="flex-1 bg-slate-50 px-5 py-4"
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#4F46E5"
				/>
			}
		>
			{/* Greeting & Date Header */}
			<View className="mb-6 rounded-2xl bg-indigo-600 p-5 shadow-sm">
				<View className="flex-row items-center space-x-2">
					<Calendar size={16} color="#E0E7FF" />
					<Text className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-100">
						{todayFormatted}
					</Text>
				</View>
				<Text className="mt-2 text-2xl font-bold text-white">
					¡Hola, {user?.firstName || 'Docente'}!
				</Text>
				<Text className="mt-1 text-sm text-indigo-100">
					{user?.role === 'preceptor'
						? 'Panel de Preceptoría • Control de Asistencia'
						: 'Panel Docente • Asistencia de Cursos'}
				</Text>
			</View>

			{/* Quick Stats Summary */}
			<View className="mb-6 flex-row space-x-3">
				<View className="mr-3 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
						<BookOpen size={18} color="#4F46E5" />
					</View>
					<Text className="mt-2 text-2xl font-bold text-slate-800">
						{courses.length}
					</Text>
					<Text className="text-xs font-medium text-slate-500">
						Cursos asignados
					</Text>
				</View>
				<View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
						<CheckCircle size={18} color="#059669" />
					</View>
					<Text className="mt-2 text-2xl font-bold text-slate-800">Hoy</Text>
					<Text className="text-xs font-medium text-slate-500">
						Toma rápida activa
					</Text>
				</View>
			</View>

			{/* Course Section Title */}
			<View className="mb-3 flex-row items-center justify-between">
				<Text className="text-lg font-bold text-slate-900">
					Cursos y Divisiones
				</Text>
				<Text className="text-xs font-semibold text-slate-500">
					Seleccioná para pasar lista
				</Text>
			</View>

			{/* Course List */}
			{isLoading ? (
				<View className="items-center justify-center py-12">
					<ActivityIndicator size="large" color="#4F46E5" />
					<Text className="mt-3 text-sm text-slate-500">Cargando cursos...</Text>
				</View>
			) : courses.length === 0 ? (
				<View className="items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8">
					<Users size={32} color="#94A3B8" />
					<Text className="mt-3 text-base font-semibold text-slate-700">
						No hay cursos disponibles
					</Text>
					<Text className="mt-1 text-center text-xs text-slate-400">
						No tenés cursos asignados para este ciclo lectivo.
					</Text>
				</View>
			) : (
				<View className="space-y-3 pb-8">
					{courses.map((course) => (
						<TouchableOpacity
							key={course.id}
							onPress={() =>
								router.push({
									pathname: '/(app)/attendance/[id]',
									params: { id: course.id, name: course.name },
								})
							}
							className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:border-indigo-400 active:bg-indigo-50/20"
						>
							<View className="flex-row items-center space-x-3.5">
								<View className="h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
									<BookOpen size={22} color="#4F46E5" />
								</View>
								<View className="ml-3">
									<Text className="text-base font-bold text-slate-800">
										{course.name}
									</Text>
									<View className="mt-1 flex-row items-center space-x-2">
										<View className="flex-row items-center">
											<Clock size={12} color="#64748B" />
											<Text className="ml-1 text-xs text-slate-500 capitalize">
												{course.shift || 'Mañana'}
											</Text>
										</View>
									</View>
								</View>
							</View>

							<View className="flex-row items-center">
								<View className="rounded-lg bg-indigo-50 px-2.5 py-1">
									<Text className="text-xs font-semibold text-indigo-700">
										Pasar lista
									</Text>
								</View>
								<ChevronRight size={18} color="#94A3B8" className="ml-1.5" />
							</View>
						</TouchableOpacity>
					))}
				</View>
			)}
		</ScrollView>
	);
}
