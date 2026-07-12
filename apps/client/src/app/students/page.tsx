'use client';

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CheckCircle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	FileText,
	Input,
	Label,
	Plus,
	Search,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Shield,
	User as UserIcon,
} from '@repo/ui';
import React from 'react';
import { AppLayout } from '../../components/layout';
import { Student } from '../../entities';
import { useAcademic } from '../../hooks/useAcademic';

export default function StudentsPage() {
	const { courses, students, enrollStudent, isStudentsLoading, isEnrolling } =
		useAcademic();

	const [selectedShift, setSelectedShift] = React.useState<string>('all');
	const [selectedCourse, setSelectedCourse] = React.useState<string>('all');
	const [searchQuery, setSearchQuery] = React.useState<string>('');
	const [isEnrollModalOpen, setIsEnrollModalOpen] =
		React.useState<boolean>(false);
	const [selectedStudentForView, setSelectedStudentForView] =
		React.useState<Student | null>(null);

	// Form states
	const [firstName, setFirstName] = React.useState('');
	const [lastName, setLastName] = React.useState('');
	const [dni, setDni] = React.useState('');
	const [birthDate, setBirthDate] = React.useState('');
	const [tutorName, setTutorName] = React.useState('');
	const [tutorPhone, setTutorPhone] = React.useState('');
	const [targetCourse, setTargetCourse] = React.useState('');

	const [formError, setFormError] = React.useState<string | null>(null);
	const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

	// Filtering logic
	const filteredStudents = students.filter((s) => {
		// Filter by Course
		const matchesCourse =
			selectedCourse === 'all' || s.courseId === selectedCourse;

		// Filter by Shift (Turno)
		const course = courses.find((c) => c.id === s.courseId);
		const matchesShift =
			selectedShift === 'all' || (course && course.shift === selectedShift);

		// Search matches Student Name, DNI, or Tutor Name
		const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
		const matchesSearch =
			fullName.includes(searchQuery.toLowerCase()) ||
			s.documentNumber.includes(searchQuery) ||
			s.tutorName.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesCourse && matchesShift && matchesSearch;
	});

	const getCourseLabel = (courseId: string) => {
		const c = courses.find((x) => x.id === courseId);
		return c ? `${c.yearNumber}º "${c.division}"` : 'Sin Curso';
	};

	const getCourseFullLabel = (courseId: string) => {
		const c = courses.find((x) => x.id === courseId);
		if (!c) return 'Sin Curso';
		const shiftStr =
			c.shift === 'morning'
				? 'Mañana'
				: c.shift === 'afternoon'
					? 'Tarde'
					: 'Noche';
		return `${c.yearNumber}º "${c.division}" (Turno ${shiftStr})`;
	};

	const handleEnroll = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);

		if (
			!firstName ||
			!lastName ||
			!dni ||
			!birthDate ||
			!tutorName ||
			!tutorPhone ||
			!targetCourse
		) {
			setFormError('Todos los campos son obligatorios para la inscripción.');
			return;
		}

		try {
			await enrollStudent({
				courseId: targetCourse,
				firstName,
				lastName,
				documentNumber: dni,
				birthDate,
				tutorName,
				tutorPhone,
			});

			// Reset form & Notify success
			setFirstName('');
			setLastName('');
			setDni('');
			setBirthDate('');
			setTutorName('');
			setTutorPhone('');
			setTargetCourse('');
			setIsEnrollModalOpen(false);

			setSuccessMsg('Estudiante inscrito exitosamente.');
			setTimeout(() => setSuccessMsg(null), 3000);
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : 'Error al inscribir al estudiante.';
			setFormError(msg);
		}
	};

	return (
		<AppLayout
			title="Gestión de Estudiantes"
			subtitle="Matriculación, listados e historiales del alumnado"
		>
			<div className="flex flex-col gap-6">
				{/* Top Search & Filter Bar */}
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
					<div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
						{/* Search Input */}
						<div className="relative flex-1">
							<Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
							<Input
								placeholder="Buscar por alumno, DNI o tutor..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 rounded-xl border border-border h-11 focus-visible:ring-primary bg-background"
							/>
						</div>

						{/* Split filters: Turno (Shift) */}
						<Select value={selectedShift} onValueChange={setSelectedShift}>
							<SelectTrigger className="w-full sm:w-[160px] rounded-xl border border-border h-11 bg-background">
								<SelectValue placeholder="Todos los Turnos" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border border-border bg-background">
								<SelectItem value="all">Todos los Turnos</SelectItem>
								<SelectItem value="morning">Mañana</SelectItem>
								<SelectItem value="afternoon">Tarde</SelectItem>
								<SelectItem value="night">Noche</SelectItem>
							</SelectContent>
						</Select>

						{/* Split filters: Curso (Course) */}
						<Select value={selectedCourse} onValueChange={setSelectedCourse}>
							<SelectTrigger className="w-full sm:w-[180px] rounded-xl border border-border h-11 bg-background">
								<SelectValue placeholder="Todos los Cursos" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border border-border bg-background">
								<SelectItem value="all">Todos los Cursos</SelectItem>
								{courses.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.yearNumber}º "{c.division}"
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Enroll Student Dialog Trigger Button */}
					<Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
						<DialogTrigger asChild>
							<Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-11 px-5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-2">
								<Plus className="h-5 w-5" />
								Inscribir Alumno
							</Button>
						</DialogTrigger>

						<DialogContent className="sm:max-w-[480px] rounded-3xl border border-border bg-background shadow-2xl">
							<DialogHeader>
								<DialogTitle className="text-lg font-extrabold text-foreground">
									Inscribir Estudiante
								</DialogTitle>
								<DialogDescription className="text-sm text-muted-foreground font-medium">
									Rellene los datos para matricular al alumno en el ciclo lectivo
									vigente.
								</DialogDescription>
							</DialogHeader>

							{formError && (
								<div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-3.5 py-2.5 rounded-xl font-medium">
									{formError}
								</div>
							)}

							<form onSubmit={handleEnroll} className="space-y-4 py-2">
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label
											htmlFor="firstName"
											className="font-semibold text-xs text-muted-foreground uppercase"
										>
											Nombres
										</Label>
										<Input
											id="firstName"
											value={firstName}
											onChange={(e) => setFirstName(e.target.value)}
											className="rounded-xl border border-border h-10 bg-background"
										/>
									</div>
									<div className="space-y-1.5">
										<Label
											htmlFor="lastName"
											className="font-semibold text-xs text-muted-foreground uppercase"
										>
											Apellidos
										</Label>
										<Input
											id="lastName"
											value={lastName}
											onChange={(e) => setLastName(e.target.value)}
											className="rounded-xl border border-border h-10 bg-background"
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label
											htmlFor="dni"
											className="font-semibold text-xs text-muted-foreground uppercase"
										>
											Documento / DNI
										</Label>
										<Input
											id="dni"
											placeholder="XX.XXX.XXX"
											value={dni}
											onChange={(e) => setDni(e.target.value)}
											className="rounded-xl border border-border h-10 bg-background"
										/>
									</div>
									<div className="space-y-1.5">
										<Label
											htmlFor="birthDate"
											className="font-semibold text-xs text-muted-foreground uppercase"
										>
											Nacimiento
										</Label>
										<Input
											id="birthDate"
											type="date"
											value={birthDate}
											onChange={(e) => setBirthDate(e.target.value)}
											className="rounded-xl border border-border h-10 bg-background"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label
										htmlFor="targetCourse"
										className="font-semibold text-xs text-muted-foreground uppercase"
									>
										Curso de Destino
									</Label>
									<Select value={targetCourse} onValueChange={setTargetCourse}>
										<SelectTrigger className="rounded-xl border border-border h-10 bg-background">
											<SelectValue placeholder="Seleccione Curso..." />
										</SelectTrigger>
										<SelectContent className="rounded-xl border border-border bg-background">
											{courses.map((c) => (
												<SelectItem key={c.id} value={c.id}>
													{c.yearNumber}º "{c.division}" - Turno{' '}
													{c.shift === 'morning' ? 'Mañana' : 'Tarde'}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="border-t border-border/50 my-2 pt-3">
									<h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
										Datos del Tutor de Contacto
									</h4>
									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-1.5">
											<Label
												htmlFor="tutorName"
												className="font-semibold text-xs text-muted-foreground uppercase"
											>
												Nombre Tutor
											</Label>
											<Input
												id="tutorName"
												value={tutorName}
												onChange={(e) => setTutorName(e.target.value)}
												className="rounded-xl border border-border h-10 bg-background"
											/>
										</div>
										<div className="space-y-1.5">
											<Label
												htmlFor="tutorPhone"
												className="font-semibold text-xs text-muted-foreground uppercase"
											>
												Teléfono Tutor
											</Label>
											<Input
												id="tutorPhone"
												placeholder="11-XXXX-XXXX"
												value={tutorPhone}
												onChange={(e) => setTutorPhone(e.target.value)}
												className="rounded-xl border border-border h-10 bg-background"
											/>
										</div>
									</div>
								</div>

								<DialogFooter className="pt-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsEnrollModalOpen(false)}
										className="rounded-xl"
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										disabled={isEnrolling}
										className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/10"
									>
										{isEnrolling ? 'Inscribiendo...' : 'Confirmar Matrícula'}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>

				{/* Success Alert */}
				{successMsg && (
					<div className="bg-primary/10 border border-primary/25 text-primary text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5 font-bold animate-fade-in">
						<CheckCircle className="h-5 w-5 text-primary" />
						<span>{successMsg}</span>
					</div>
				)}

				{/* Students List Card */}
				<Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
					<CardContent className="p-0">
						{isStudentsLoading ? (
							<div className="p-12 text-center text-sm text-muted-foreground">
								Cargando estudiantes...
							</div>
						) : filteredStudents.length === 0 ? (
							<div className="p-12 text-center text-sm text-muted-foreground">
								No se encontraron alumnos coincidentes con los filtros aplicados.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse">
									<thead>
										<tr className="bg-muted/10 border-b border-border">
											<th className="p-4 text-xs font-bold text-muted-foreground uppercase">
												Alumno
											</th>
											<th className="p-4 text-xs font-bold text-muted-foreground uppercase">
												DNI
											</th>
											<th className="p-4 text-xs font-bold text-muted-foreground uppercase">
												Curso
											</th>
											<th className="p-4 text-xs font-bold text-muted-foreground uppercase">
												Tutor
											</th>
											<th className="p-4 text-xs font-bold text-muted-foreground uppercase text-center">
												Acciones
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{filteredStudents.map((student) => (
											<tr key={student.id} className="hover:bg-muted/5 transition-colors">
												<td className="p-4 text-sm font-bold text-foreground">
													{student.lastName}, {student.firstName}
												</td>
												<td className="p-4 text-sm text-muted-foreground font-semibold">
													{student.documentNumber}
												</td>
												<td className="p-4 text-sm font-bold text-primary">
													{getCourseLabel(student.courseId)}
												</td>
												<td className="p-4 text-sm text-foreground font-medium">
													{student.tutorName}
												</td>
												<td className="p-4 text-sm text-center">
													<Button
														variant="outline"
														size="sm"
														onClick={() => setSelectedStudentForView(student)}
														className="rounded-xl border border-border text-xs font-semibold hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5"
													>
														<FileText className="h-3.5 w-3.5" />
														Ver Ficha
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Student View Details Dialog Modal */}
			<Dialog
				open={!!selectedStudentForView}
				onOpenChange={(open) => {
					if (!open) setSelectedStudentForView(null);
				}}
			>
				<DialogContent className="sm:max-w-[460px] rounded-3xl border border-border bg-background shadow-2xl p-6">
					<DialogHeader className="border-b border-border pb-4 mb-4">
						<div className="flex items-center gap-3">
							<div className="h-11 w-11 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
								<UserIcon className="h-5 w-5" />
							</div>
							<div>
								<DialogTitle className="text-base font-extrabold text-foreground">
									{selectedStudentForView?.lastName}, {selectedStudentForView?.firstName}
								</DialogTitle>
								<DialogDescription className="text-xs font-medium text-muted-foreground">
									Ficha del Estudiante Matriculado
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{selectedStudentForView && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
								<div>
									<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
										Documento / DNI
									</span>
									<span className="text-sm font-bold text-foreground">
										{selectedStudentForView.documentNumber}
									</span>
								</div>
								<div>
									<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
										Fecha Nacimiento
									</span>
									<span className="text-sm font-bold text-foreground">
										{selectedStudentForView.birthDate}
									</span>
								</div>
							</div>

							<div className="space-y-1">
								<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
									Curso de Inscripción
								</span>
								<span className="text-sm font-bold text-primary">
									{getCourseFullLabel(selectedStudentForView.courseId)}
								</span>
							</div>

							<div className="border-t border-border/50 my-2 pt-3 space-y-3">
								<h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
									Tutor de Contacto
								</h4>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
											Nombre
										</span>
										<span className="text-sm font-bold text-foreground">
											{selectedStudentForView.tutorName}
										</span>
									</div>
									<div>
										<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
											Teléfono
										</span>
										<span className="text-sm font-semibold text-foreground">
											{selectedStudentForView.tutorPhone}
										</span>
									</div>
								</div>
							</div>

							<div className="border-t border-border/50 my-2 pt-3 flex items-center justify-between">
								<div>
									<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
										Estado Académico
									</span>
									<span className="inline-block bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1">
										Regular / Activo
									</span>
								</div>
								<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
									<Shield className="h-3.5 w-3.5 text-primary" />
									Datos verificados
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="mt-4 border-t border-border/50 pt-4">
						<Button
							variant="outline"
							onClick={() => setSelectedStudentForView(null)}
							className="rounded-xl w-full"
						>
							Cerrar Ficha
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</AppLayout>
	);
}
