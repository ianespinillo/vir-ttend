'use client';

import {
	AlertTriangle,
	BarChart3,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Clock,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	UserCheck,
	Users,
} from '@repo/ui';
import React from 'react';
import { AppLayout } from '../../components/layout';
import { useAcademic } from '../../hooks/useAcademic';
import { useAttendance } from '../../hooks/useAttendance';

export default function DashboardPage() {
	const { courses } = useAcademic();
	const [selectedShift, setSelectedShift] = React.useState<string>('all');
	const [selectedCourse, setSelectedCourse] = React.useState<string>('all');

	// Filter course options by active Shift
	const filteredCourses = courses.filter(
		(c) => selectedShift === 'all' || c.shift === selectedShift,
	);

	// Reset course if it is not present in the filtered list
	React.useEffect(() => {
		if (
			selectedCourse !== 'all' &&
			!filteredCourses.some((c) => c.id === selectedCourse)
		) {
			setSelectedCourse('all');
		}
	}, [selectedShift, filteredCourses, selectedCourse]);

	const { metrics, isMetricsLoading } = useAttendance({
		courseId: selectedCourse === 'all' ? undefined : selectedCourse,
	});

	// Simulation of critical alerts based on active metrics/course
	const studentsAtRisk = [
		{ name: 'Mateo Rodríguez', course: '1º "A"', absences: 4.5, rate: '72%' },
		{ name: 'Santiago López', course: '1º "A"', absences: 3.0, rate: '79%' },
	];

	return (
		<AppLayout
			title="Panel de Control"
			subtitle="Visualización y estadísticas en tiempo real del presentismo escolar"
		>
			<div className="flex flex-col gap-6">
				{/* Course Filter Panel (Mobile Friendly) */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
					<span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
						Filtrar por:
					</span>
					<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
						{/* Turno select */}
						<Select value={selectedShift} onValueChange={setSelectedShift}>
							<SelectTrigger className="w-full sm:w-[180px] rounded-xl border border-border bg-background h-11 focus:ring-primary">
								<SelectValue placeholder="Todos los Turnos" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border border-border bg-background">
								<SelectItem value="all">Todos los Turnos</SelectItem>
								<SelectItem value="morning">Mañana</SelectItem>
								<SelectItem value="afternoon">Tarde</SelectItem>
								<SelectItem value="night">Noche</SelectItem>
							</SelectContent>
						</Select>

						{/* Curso select */}
						<Select value={selectedCourse} onValueChange={setSelectedCourse}>
							<SelectTrigger className="w-full sm:w-[180px] rounded-xl border border-border bg-background h-11 focus:ring-primary">
								<SelectValue placeholder="Todos los Cursos" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border border-border bg-background">
								<SelectItem value="all">Todos los Cursos</SelectItem>
								{filteredCourses.map((course) => (
									<SelectItem key={course.id} value={course.id}>
										{course.yearNumber}º "{course.division}"
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Metrics Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
							<CardTitle className="text-sm font-semibold text-muted-foreground">
								Alumnos Totales
							</CardTitle>
							<Users className="h-5 w-5 text-primary" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-black text-foreground">
								{isMetricsLoading ? '...' : metrics.totalStudents}
							</div>
							<p className="text-xs text-muted-foreground font-medium mt-1">
								Registrados en la institución
							</p>
						</CardContent>
					</Card>

					<Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
							<CardTitle className="text-sm font-semibold text-muted-foreground">
								Presentes Hoy
							</CardTitle>
							<UserCheck className="h-5 w-5 text-primary" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-black text-foreground">
								{isMetricsLoading ? '...' : metrics.presentCount}
							</div>
							<p className="text-xs text-muted-foreground font-medium mt-1">
								Alumnos en aula física
							</p>
						</CardContent>
					</Card>

					<Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
							<CardTitle className="text-sm font-semibold text-muted-foreground">
								Inasistencias
							</CardTitle>
							<AlertTriangle className="h-5 w-5 text-destructive" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-black text-foreground">
								{isMetricsLoading ? '...' : metrics.absentCount}
							</div>
							<p className="text-xs text-muted-foreground font-medium mt-1">
								{metrics.justifiedCount} justificadas hoy
							</p>
						</CardContent>
					</Card>

					<Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
							<CardTitle className="text-sm font-semibold text-muted-foreground">
								Tasa de Asistencia
							</CardTitle>
							<BarChart3 className="h-5 w-5 text-primary" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-black text-foreground">
								{isMetricsLoading
									? '...'
									: `${metrics.attendancePercentage.toFixed(1)}%`}
							</div>
							{/* Progress Bar */}
							<div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
								<div
									className="bg-primary h-full rounded-full transition-all duration-500"
									style={{ width: `${metrics.attendancePercentage}%` }}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Panels */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Alerts & Critical Students */}
					<Card className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm">
						<CardHeader className="border-b border-border pb-4">
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-destructive" />
								<CardTitle className="text-base font-extrabold text-foreground">
									Alertas de Faltas Críticas
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							{selectedCourse === 'c-2' ? (
								<div className="p-8 text-center text-sm text-muted-foreground font-medium">
									Sin alertas vigentes para este curso. ¡Buen presentismo!
								</div>
							) : (
								<div className="divide-y divide-border">
									{studentsAtRisk.map((student) => (
										<div
											key={student.name}
											className="flex items-center justify-between p-4 hover:bg-muted/15 transition-colors"
										>
											<div className="flex flex-col">
												<span className="font-bold text-sm text-foreground">
													{student.name}
												</span>
												<span className="text-xs text-muted-foreground font-medium">
													Curso: {student.course}
												</span>
											</div>
											<div className="flex items-center gap-4">
												<div className="text-right">
													<div className="text-sm font-bold text-destructive">
														{student.absences} inasistencias
													</div>
													<div className="text-xs text-muted-foreground font-medium">
														Asistencia: {student.rate}
													</div>
												</div>
												<div className="bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border border-destructive/20 bg-background">
													Riesgo Alto
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Timeline Log */}
					<Card className="rounded-2xl border border-border bg-card shadow-sm">
						<CardHeader className="border-b border-border pb-4">
							<div className="flex items-center gap-2">
								<Clock className="h-5 w-5 text-primary" />
								<CardTitle className="text-base font-extrabold text-foreground">
									Actividad Reciente
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="py-4 space-y-4">
							<div className="flex gap-3">
								<div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
								<div>
									<p className="text-xs font-semibold text-foreground">
										Firma diaria registrada
									</p>
									<span className="text-[10px] text-muted-foreground font-medium">
										1º A · Hoy 08:15 hs
									</span>
								</div>
							</div>
							<div className="flex gap-3">
								<div className="h-2 w-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
								<div>
									<p className="text-xs font-semibold text-foreground">
										Justificación de falta cargada
									</p>
									<span className="text-[10px] text-muted-foreground font-medium">
										Sofía García · Ayer 17:30 hs
									</span>
								</div>
							</div>
							<div className="flex gap-3">
								<div className="h-2 w-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
								<div>
									<p className="text-xs font-semibold text-foreground">
										Alerta disparada (Límite superado)
									</p>
									<span className="text-[10px] text-muted-foreground font-medium">
										Mateo Rodríguez · 10/07 11:20 hs
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</AppLayout>
	);
}
