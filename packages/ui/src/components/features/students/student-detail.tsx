'use client';

import type { ICourseResponse, IStudentDetailResponse } from '@repo/common';
import {
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Edit,
	FileBadge,
	GraduationCap,
	User,
	UserMinus,
	UserPlus,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { TutorInfo } from './tutor-info';

export interface StudentDetailProps {
	student: IStudentDetailResponse;
	courses?: ICourseResponse[];
	onBack?: () => void;
	onEdit?: () => void;
	onEnroll?: () => void;
	onTransfer?: () => void;
	onDeactivate?: () => void;
	isAdmin?: boolean;
	isPreceptor?: boolean;
	attendancePath?: string;
}

export function StudentDetail({
	student,
	courses = [],
	onBack,
	onEdit,
	onEnroll,
	onTransfer,
	onDeactivate,
	isAdmin = false,
	isPreceptor = false,
	attendancePath,
}: StudentDetailProps) {
	const initials =
		`${student.firstName[0] || ''}${student.lastName[0] || ''}`.toUpperCase();

	const course = courses.find((c) => c.id === student.courseId);
	const courseDisplayName =
		student.courseName ||
		(course
			? course.fullName ||
				`${course.yearNumber}° ${course.division} (${course.level})`
			: student.courseId);

	const formattedBirthDate = student.birthDate
		? new Date(student.birthDate).toLocaleDateString('es-AR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			})
		: '—';

	return (
		<div className="space-y-6 max-w-4xl">
			{onBack && (
				<Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
					<ArrowLeft className="h-4 w-4" />
					Volver al listado
				</Button>
			)}

			<Card className="border shadow-sm">
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
						<div className="flex items-center gap-4">
							<Avatar className="h-16 w-16 text-lg font-bold border-2 border-primary/20">
								<AvatarFallback className="bg-primary/10 text-primary">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="space-y-1">
								<div className="flex items-center gap-3">
									<h2 className="text-2xl font-bold text-foreground">
										{student.lastName}, {student.firstName}
									</h2>
									{student.status === 'ACTIVE' ? (
										<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
											Activo
										</Badge>
									) : student.status === 'TRANSFERRED' ? (
										<Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
											Transferido
										</Badge>
									) : (
										<Badge variant="outline" className="bg-muted">
											Inactivo
										</Badge>
									)}
								</div>
								<p className="text-sm text-muted-foreground flex items-center gap-2">
									<FileBadge className="h-4 w-4" /> DNI: {student.documentNumber}
									<span className="text-muted-foreground/40">•</span>
									<GraduationCap className="h-4 w-4" /> {courseDisplayName}
								</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
							{(isAdmin || isPreceptor) && onEdit && (
								<Button
									variant="outline"
									size="sm"
									onClick={onEdit}
									className="gap-1.5"
								>
									<Edit className="h-4 w-4" />
									Editar
								</Button>
							)}
							{isAdmin && (
								<>
									{onEnroll && (
										<Button
											variant="outline"
											size="sm"
											onClick={onEnroll}
											className="gap-1.5"
										>
											<UserPlus className="h-4 w-4" />
											Matricular
										</Button>
									)}
									{onTransfer && (
										<Button
											variant="outline"
											size="sm"
											onClick={onTransfer}
											className="gap-1.5"
										>
											<UserPlus className="h-4 w-4" />
											Transferir
										</Button>
									)}
									{onDeactivate && student.status === 'ACTIVE' && (
										<Button
											variant="destructive"
											size="sm"
											onClick={onDeactivate}
											className="gap-1.5"
										>
											<UserMinus className="h-4 w-4" />
											Desactivar
										</Button>
									)}
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			<Tabs defaultValue="personal" className="w-full">
				<TabsList className="grid w-full grid-cols-3 max-w-md">
					<TabsTrigger value="personal">Datos Personales</TabsTrigger>
					<TabsTrigger value="tutor">Tutor</TabsTrigger>
					<TabsTrigger value="attendance">Asistencia</TabsTrigger>
				</TabsList>

				<TabsContent value="personal" className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<User className="h-5 w-5 text-primary" />
								Ficha del Estudiante
							</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-1">
								<span className="text-xs font-medium text-muted-foreground uppercase">
									Nombre Completo
								</span>
								<p className="text-sm font-medium">
									{student.firstName} {student.lastName}
								</p>
							</div>

							<div className="space-y-1">
								<span className="text-xs font-medium text-muted-foreground uppercase">
									Documento de Identidad (DNI)
								</span>
								<p className="text-sm font-mono font-medium">
									{student.documentNumber}
								</p>
							</div>

							<div className="space-y-1">
								<span className="text-xs font-medium text-muted-foreground uppercase">
									Fecha de Nacimiento
								</span>
								<p className="text-sm font-medium flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									{formattedBirthDate} ({student.age} años)
								</p>
							</div>

							<div className="space-y-1">
								<span className="text-xs font-medium text-muted-foreground uppercase">
									Curso Actual
								</span>
								<p className="text-sm font-medium flex items-center gap-2">
									<GraduationCap className="h-4 w-4 text-muted-foreground" />
									{courseDisplayName}
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="tutor" className="pt-4">
					<TutorInfo
						tutorName={student.tutorName}
						tutorPhone={student.tutorPhone}
						tutorEmail={student.tutorEmail}
					/>
				</TabsContent>

				<TabsContent value="attendance" className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<CheckCircle2 className="h-5 w-5 text-primary" />
								Historial y Métrica de Asistencia
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Accede al registro detallado de inasistencias y asistencias acumuladas
								del estudiante.
							</p>
							{attendancePath ? (
								<Button asChild variant="outline">
									<a href={attendancePath}>Ver detalle de asistencias completa</a>
								</Button>
							) : (
								<p className="text-sm font-medium text-primary">
									Integrado con el módulo de Asistencia (Sprint 05).
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
