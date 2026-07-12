'use client';

import {
	AlertCircle,
	AlertTriangle,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CheckCircle,
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
import { AttendanceStatus } from '../../entities';
import { useAcademic } from '../../hooks/useAcademic';
import { useAttendance } from '../../hooks/useAttendance';

export default function AttendancePage() {
	const { courses, subjects, students, isStudentsLoading } = useAcademic();
	const [selectedShift, setSelectedShift] = React.useState<string>('all');
	const [selectedCourse, setSelectedCourse] = React.useState<string>('');
	const [selectedSubject, setSelectedSubject] = React.useState<string>('daily');
	const [selectedDate, setSelectedDate] = React.useState<string>(
		new Date().toISOString().split('T')[0],
	);

	// Load existing records if any
	const { records, registerAttendance, isRegistering } = useAttendance({
		courseId: selectedCourse || undefined,
		subjectId: selectedSubject === 'daily' ? undefined : selectedSubject,
		date: selectedDate,
	});

	// Local state to keep track of checkboxes/selections before saving
	const [attendanceStates, setAttendanceStates] = React.useState<
		Record<string, AttendanceStatus>
	>({});

	// Filter courses list by selectedShift
	const filteredCourses = courses.filter(
		(c) => selectedShift === 'all' || c.shift === selectedShift,
	);

	// Filter subjects to show only those corresponding to the selected course
	const filteredSubjects = subjects.filter((s) => s.courseId === selectedCourse);

	// Reset selected course if it is not in the filtered courses list
	React.useEffect(() => {
		if (selectedCourse && !filteredCourses.some((c) => c.id === selectedCourse)) {
			setSelectedCourse('');
		}
	}, [selectedShift, filteredCourses, selectedCourse]);

	// Auto-select the first course of the filtered courses list if none is selected
	React.useEffect(() => {
		if (filteredCourses.length > 0 && !selectedCourse) {
			setSelectedCourse(filteredCourses[0].id);
		}
	}, [filteredCourses, selectedCourse]);

	// Initialize local attendanceStates only when parameters or student list changes
	React.useEffect(() => {
		if (students && students.length > 0) {
			const initialStates: Record<string, AttendanceStatus> = {};
			students.forEach((student) => {
				const existingRecord = records.find((r) => r.studentId === student.id);
				initialStates[student.id] = existingRecord
					? existingRecord.status
					: 'present';
			});
			setAttendanceStates(initialStates);
		}
	}, [students, selectedCourse, selectedSubject, selectedDate]);

	const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
		setAttendanceStates((prev) => ({
			...prev,
			[studentId]: status,
		}));
	};

	const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

	const handleSave = async () => {
		if (!selectedCourse) return;
		setSuccessMsg(null);

		const recordsToSubmit = Object.entries(attendanceStates).map(
			([studentId, status]) => ({
				studentId,
				status,
			}),
		);

		try {
			await registerAttendance({
				courseId: selectedCourse,
				subjectId: selectedSubject === 'daily' ? '' : selectedSubject,
				date: selectedDate,
				records: recordsToSubmit,
			});
			setSuccessMsg('¡Asistencia registrada con éxito!');
			setTimeout(() => setSuccessMsg(null), 3000);
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<AppLayout
			title="Registrar Asistencia"
			subtitle="Toma de asistencia y justificaciones de inasistencia"
		>
			<div className="flex flex-col gap-6">
				{/* Settings & Selectors Bar */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
					{/* Date picker */}
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
							Fecha
						</span>
						<input
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="w-full bg-background rounded-xl border border-border h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
						/>
					</div>

					{/* Turno Selector */}
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
							Turno
						</span>
						<Select value={selectedShift} onValueChange={setSelectedShift}>
							<SelectTrigger className="rounded-xl border border-border h-11 bg-background">
								<SelectValue placeholder="Todos los Turnos" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border border-border bg-background">
								<SelectItem value="all">Todos los Turnos</SelectItem>
								<SelectItem value="morning">Mañana</SelectItem>
								<SelectItem value="afternoon">Tarde</SelectItem>
								<SelectItem value="night">Noche</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Course Selector */}
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
							Curso
						</span>
						<Select
							value={selectedCourse}
							onValueChange={(val) => {
								setSelectedCourse(val);
								setSelectedSubject('daily');
							}}
						>
							<SelectTrigger className="rounded-xl border border-border h-11 bg-background">
								<SelectValue placeholder="Seleccione Curso..." />
							</SelectTrigger>
							<SelectContent className="rounded-xl border border-border bg-background">
								{filteredCourses.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.yearNumber}º "{c.division}"
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Subject / General Selector */}
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
							Materia
						</span>
						<Select
							value={selectedSubject}
							onValueChange={setSelectedSubject}
							disabled={!selectedCourse}
						>
							<SelectTrigger className="rounded-xl border border-border h-11 bg-background">
								<SelectValue placeholder="Asistencia General" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border border-border bg-background">
								<SelectItem value="daily">Asistencia General (Día Completo)</SelectItem>
								{filteredSubjects.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Success notifications */}
				{successMsg && (
					<div className="bg-primary/10 border border-primary/25 text-primary text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5 font-bold animate-fade-in">
						<CheckCircle className="h-5 w-5 text-primary" />
						<span>{successMsg}</span>
					</div>
				)}

				{/* Main Student Register Card */}
				{!selectedCourse ? (
					<Card className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
						<AlertCircle className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
						<h3 className="font-extrabold text-lg text-foreground mb-1">
							Falta Seleccionar Parámetros
						</h3>
						<p className="text-sm text-muted-foreground font-medium">
							Por favor, elija un turno, curso y fecha en la barra superior para cargar
							el registro de alumnos.
						</p>
					</Card>
				) : (
					<Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
						<CardHeader className="border-b border-border pb-4 bg-muted/10">
							<CardTitle className="text-base font-extrabold text-foreground">
								Registro de Alumnos: {students.length} estudiantes matriculados
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							{isStudentsLoading ? (
								<div className="p-8 text-center text-sm text-muted-foreground">
									Cargando lista de estudiantes...
								</div>
							) : students.length === 0 ? (
								<div className="p-8 text-center text-sm text-muted-foreground">
									No se encontraron alumnos matriculados en este curso.
								</div>
							) : (
								<div className="divide-y divide-border">
									{students.map((student) => {
										const currentStatus = attendanceStates[student.id] || 'present';

										return (
											<div
												key={student.id}
												className="flex flex-col md:flex-row md:items-center md:justify-between p-4 gap-4 hover:bg-muted/5 transition-colors"
											>
												{/* Student details */}
												<div className="flex flex-col">
													<span className="font-bold text-sm text-foreground">
														{student.lastName}, {student.firstName}
													</span>
													<span className="text-xs text-muted-foreground font-semibold">
														DNI: {student.documentNumber}
													</span>
												</div>

												{/* Attendance status toggle options (Mobile Friendly) */}
												<div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5">
													{(
														[
															{
																key: 'present',
																label: 'Presente',
																activeClass: 'bg-primary/10 text-primary border-primary/30',
															},
															{
																key: 'absent',
																label: 'Ausente',
																activeClass:
																	'bg-destructive/10 text-destructive border-destructive/30',
															},
															{
																key: 'late',
																label: 'Tarde',
																activeClass:
																	'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
															},
															{
																key: 'justified',
																label: 'Justificado',
																activeClass:
																	'bg-secondary text-secondary-foreground border-secondary',
															},
														] as const
													).map((opt) => {
														const active = currentStatus === opt.key;
														return (
															<button
																key={opt.key}
																type="button"
																onClick={() => handleStatusChange(student.id, opt.key)}
																className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition-all ${
																	active
																		? opt.activeClass
																		: 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
																}`}
															>
																{opt.label}
															</button>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>

						{/* Footer Actions */}
						<div className="p-4 border-t border-border bg-muted/10 flex items-center justify-end">
							<Button
								type="button"
								onClick={handleSave}
								disabled={isRegistering || students.length === 0}
								className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-md shadow-primary/10 transition-all duration-200"
							>
								{isRegistering ? 'Guardando...' : 'Guardar Asistencia'}
							</Button>
						</div>
					</Card>
				)}
			</div>
		</AppLayout>
	);
}
