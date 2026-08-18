'use client';

import type { ICourseResponse } from '@repo/common';
import { BookOpen, GraduationCap, Sun, UserCheck, Users } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';

export interface CourseCardProps {
	course: ICourseResponse;
	onView?: (id: string) => void;
	onEdit?: (id: string) => void;
	canManage?: boolean;
}

export function CourseCard({
	course,
	onView,
	onEdit,
	canManage = false,
}: CourseCardProps) {
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

	const titleName =
		course.fullName ||
		`${course.yearNumber}° "${course.division}" - ${levelLabel}`;

	return (
		<Card className="shadow-sm border hover:border-primary/50 transition-all flex flex-col justify-between">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<CardTitle className="text-lg font-bold text-foreground">
						{titleName}
					</CardTitle>
					<Badge variant="outline" className="shrink-0 bg-primary/5">
						{shiftLabel}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4 flex-1 flex flex-col justify-between">
				<div className="space-y-2 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<GraduationCap className="h-4 w-4 text-primary shrink-0" />
						<span>
							Nivel: <strong className="text-foreground">{levelLabel}</strong>
						</span>
					</div>

					<div className="flex items-center gap-2">
						<UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
						<span>
							Preceptor:{' '}
							<strong className="text-foreground">
								{course.preceptorName || 'Sin asignar'}
							</strong>
						</span>
					</div>

					<div className="flex items-center gap-6 pt-1 text-xs">
						{course.studentCount !== undefined && (
							<span className="flex items-center gap-1">
								<Users className="h-3.5 w-3.5 text-muted-foreground" />
								{course.studentCount} Alumnos
							</span>
						)}
						{course.subjectsCount !== undefined && (
							<span className="flex items-center gap-1">
								<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
								{course.subjectsCount} Materias
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2 pt-2 border-t mt-3">
					{onView && (
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={() => onView(course.id)}
						>
							Ver Detalle
						</Button>
					)}
					{canManage && onEdit && (
						<Button variant="ghost" size="sm" onClick={() => onEdit(course.id)}>
							Editar
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
