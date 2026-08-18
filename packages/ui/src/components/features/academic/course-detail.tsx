'use client';

import type {
	DAYOFWEEK,
	ICourseDetailResponse,
	IScheduleSlotResponse,
	ISubjectResponse,
	ScheduleSlotFormValues,
} from '@repo/common';
import {
	ArrowLeft,
	BookOpen,
	Calendar,
	CheckCircle2,
	Clock,
	Edit,
	GraduationCap,
	Trash2,
	UserCheck,
	Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { ScheduleGrid } from '../schedule/schedule-grid';
import { ScheduleModal } from '../schedule/schedule-modal';
import { SubjectsList } from '../subjects/subjects-list';

export interface CourseDetailProps {
	course: ICourseDetailResponse;
	subjects?: ISubjectResponse[];
	schedule?: IScheduleSlotResponse[];
	studentCount?: number;
	onBack?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
	onAddSubject?: () => void;
	onEditSubject?: (subject: ISubjectResponse) => void;
	onDeleteSubject?: (subject: ISubjectResponse) => void;
	onSaveSchedule?: (slots: ScheduleSlotFormValues[]) => Promise<void> | void;
	canManage?: boolean;
	studentsPath?: string;
	attendancePath?: string;
}

export function CourseDetail({
	course,
	subjects = [],
	schedule = [],
	studentCount,
	onBack,
	onEdit,
	onDelete,
	onAddSubject,
	onEditSubject,
	onDeleteSubject,
	onSaveSchedule,
	canManage = false,
	studentsPath,
	attendancePath,
}: CourseDetailProps) {
	const [scheduleModalState, setScheduleModalState] = useState<{
		open: boolean;
		day?: DAYOFWEEK;
	}>({ open: false });

	const levelLabel =
		course.level === 'PRIMARY'
			? 'Primaria'
			: course.level === 'SECONDARY'
				? 'Secundaria'
				: 'Inicial';

	const shiftLabel =
		course.shift === 'MORNING'
			? 'Mañana'
			: course.shift === 'AFTERNOON'
				? 'Tarde'
				: 'Noche';

	const courseTitle =
		course.fullName ||
		`${course.yearNumber}° "${course.division}" - ${levelLabel}`;

	const handleAddSlot = async (slot: ScheduleSlotFormValues) => {
		if (onSaveSchedule) {
			const updated = [
				...schedule.map((s) => ({
					subjectId: s.subjectId,
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
				})),
				slot,
			];
			await onSaveSchedule(updated);
		}
	};

	const handleDeleteSlot = async (slotId: string) => {
		if (onSaveSchedule) {
			const updated = schedule
				.filter((s) => s.id !== slotId)
				.map((s) => ({
					subjectId: s.subjectId,
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
				}));
			await onSaveSchedule(updated);
		}
	};

	return (
		<div className="space-y-6 max-w-5xl">
			{onBack && (
				<Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
					<ArrowLeft className="h-4 w-4" />
					Volver al listado de cursos
				</Button>
			)}

			<Card className="border shadow-sm">
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-3">
								<h2 className="text-2xl font-bold text-foreground">{courseTitle}</h2>
								<Badge className="bg-primary/10 text-primary border-primary/20">
									{levelLabel}
								</Badge>
								<Badge variant="outline">{shiftLabel}</Badge>
							</div>
							<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
								<span className="flex items-center gap-1.5">
									<UserCheck className="h-4 w-4 text-emerald-600" />
									Preceptor:{' '}
									<strong className="text-foreground">
										{course.preceptorName || 'Sin asignar'}
									</strong>
								</span>
								<span>•</span>
								<span className="flex items-center gap-1.5">
									<Users className="h-4 w-4 text-primary" />
									<strong className="text-foreground">
										{studentCount ?? course.studentCount ?? 0}
									</strong>{' '}
									Estudiantes
								</span>
								<span>•</span>
								<span className="flex items-center gap-1.5">
									<BookOpen className="h-4 w-4 text-blue-500" />
									<strong className="text-foreground">{subjects.length}</strong> Materias
								</span>
							</div>
						</div>

						{canManage && (
							<div className="flex items-center gap-2">
								{onEdit && (
									<Button
										variant="outline"
										size="sm"
										onClick={onEdit}
										className="gap-1.5"
									>
										<Edit className="h-4 w-4" />
										Editar Curso
									</Button>
								)}
								{onDelete && (
									<Button
										variant="destructive"
										size="sm"
										onClick={onDelete}
										className="gap-1.5"
									>
										<Trash2 className="h-4 w-4" />
										Eliminar
									</Button>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="grid w-full grid-cols-5 max-w-xl">
					<TabsTrigger value="overview">Resumen</TabsTrigger>
					<TabsTrigger value="subjects">Materias</TabsTrigger>
					<TabsTrigger value="schedule">Horario</TabsTrigger>
					<TabsTrigger value="students">Estudiantes</TabsTrigger>
					<TabsTrigger value="attendance">Asistencia</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="pt-4 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg font-semibold flex items-center gap-2">
									<GraduationCap className="h-5 w-5 text-primary" />
									Información Académica
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								<div className="flex justify-between border-b pb-2">
									<span className="text-muted-foreground">Año / Grado</span>
									<span className="font-semibold">{course.yearNumber}° Año</span>
								</div>
								<div className="flex justify-between border-b pb-2">
									<span className="text-muted-foreground">División</span>
									<span className="font-semibold">"{course.division}"</span>
								</div>
								<div className="flex justify-between border-b pb-2">
									<span className="text-muted-foreground">Nivel Educativo</span>
									<span className="font-semibold">{levelLabel}</span>
								</div>
								<div className="flex justify-between pb-1">
									<span className="text-muted-foreground">Turno de Cursada</span>
									<span className="font-semibold">{shiftLabel}</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg font-semibold flex items-center gap-2">
									<UserCheck className="h-5 w-5 text-emerald-600" />
									Equipo de Trabajo
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								<div className="space-y-1">
									<span className="text-xs text-muted-foreground uppercase font-medium">
										Preceptor a Cargo
									</span>
									<p className="font-medium text-foreground">
										{course.preceptorName || 'Sin asignar'}
									</p>
								</div>
								<div className="space-y-1 pt-2">
									<span className="text-xs text-muted-foreground uppercase font-medium">
										Cantidad de Materias
									</span>
									<p className="font-medium text-foreground">
										{subjects.length} materias
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="subjects" className="pt-4">
					<SubjectsList
						subjects={subjects}
						onAddSubject={onAddSubject}
						onEditSubject={onEditSubject}
						onDeleteSubject={onDeleteSubject}
						canManage={canManage}
					/>
				</TabsContent>

				<TabsContent value="schedule" className="pt-4">
					<ScheduleGrid
						slots={schedule}
						subjects={subjects}
						onAddSlot={(day) => setScheduleModalState({ open: true, day })}
						onDeleteSlot={handleDeleteSlot}
						canManage={canManage}
					/>
				</TabsContent>

				<TabsContent value="students" className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<Users className="h-5 w-5 text-primary" />
								Alumnado del Curso
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Consulte la lista completa de estudiantes matriculados en este curso,
								así como las opciones de matriculación y transferencias.
							</p>
							{studentsPath ? (
								<Button asChild variant="outline">
									<a href={studentsPath}>Ver estudiantes en el módulo de Alumnado</a>
								</Button>
							) : (
								<p className="text-sm font-medium text-primary">
									Conectado al Módulo de Estudiantes (Sprint 03).
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="attendance" className="pt-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<CheckCircle2 className="h-5 w-5 text-primary" />
								Control de Asistencia Diario y por Materia
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Tome la asistencia diaria del curso o registre asistencias específicas
								por materia.
							</p>
							{attendancePath ? (
								<Button asChild variant="outline">
									<a href={attendancePath}>Ir al módulo de Asistencia</a>
								</Button>
							) : (
								<p className="text-sm font-medium text-primary">
									Integra con el módulo de Asistencia Diaria (Sprint 05/06).
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{canManage && (
				<ScheduleModal
					open={scheduleModalState.open}
					onOpenChange={(open) =>
						setScheduleModalState((prev) => ({ ...prev, open }))
					}
					subjects={subjects}
					existingSlots={schedule}
					defaultDay={scheduleModalState.day}
					onSubmit={handleAddSlot}
				/>
			)}
		</div>
	);
}
