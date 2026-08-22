'use client';

import type { CourseSnapshot } from '@repo/common';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../../ui/card';
import { StatusIndicator } from './status-indicator';

export interface CourseStatusCardProps {
	course: CourseSnapshot;
	onClick?: (courseId: string) => void;
}

export function CourseStatusCard({
	course,
	onClick,
}: Readonly<CourseStatusCardProps>) {
	const attendancePercent =
		course.totalStudents > 0
			? ((course.present + course.late + course.justified) /
					course.totalStudents) *
				100
			: 0;

	return (
		<Card
			className="shadow-xs border border-border/80 transition-colors hover:bg-muted/40 cursor-pointer"
			onClick={() => onClick?.(course.courseId)}
		>
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<StatusIndicator status={course.statusColor} size="lg" />
						<div className="min-w-0">
							<h3 className="font-semibold text-sm text-foreground truncate">
								{course.courseName}
							</h3>
							<p className="text-xs text-muted-foreground">
								{course.totalStudents} alumnos
							</p>
						</div>
					</div>
					<div className="text-right shrink-0">
						<p className="text-lg font-bold text-foreground tabular-nums">
							{attendancePercent.toFixed(0)}%
						</p>
						<p className="text-xs text-muted-foreground">asistencia</p>
					</div>
				</div>

				<div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
					<div>
						<p className="font-semibold text-emerald-600 dark:text-emerald-400">
							{course.present}
						</p>
						<p className="text-muted-foreground">Presente</p>
					</div>
					<div>
						<p className="font-semibold text-rose-600 dark:text-rose-400">
							{course.absent}
						</p>
						<p className="text-muted-foreground">Ausente</p>
					</div>
					<div>
						<p className="font-semibold text-amber-600 dark:text-amber-400">
							{course.late}
						</p>
						<p className="text-muted-foreground">Tardanza</p>
					</div>
					<div>
						<p className="font-semibold text-muted-foreground">
							{course.notRecorded}
						</p>
						<p className="text-muted-foreground">Sin cargar</p>
					</div>
				</div>

				{course.notRecorded > 0 && (
					<div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
						<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
						<span>
							{course.notRecorded}{' '}
							{course.notRecorded === 1 ? 'curso sin cargar' : 'cursos sin cargar'}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
