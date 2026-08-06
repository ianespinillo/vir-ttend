'use client';

import type { ISubjectResponse } from '@repo/common';
import { BookOpen, Clock, Edit, Plus, Trash2, UserCheck } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../ui/table';
import { EmptyState } from '../../shared/empty-state';

export interface SubjectsListProps {
	subjects: ISubjectResponse[];
	onAddSubject?: () => void;
	onEditSubject?: (subject: ISubjectResponse) => void;
	onDeleteSubject?: (subject: ISubjectResponse) => void;
	canManage?: boolean;
	isLoading?: boolean;
}

export function SubjectsList({
	subjects,
	onAddSubject,
	onEditSubject,
	onDeleteSubject,
	canManage = false,
	isLoading = false,
}: SubjectsListProps) {
	if (subjects.length === 0 && !isLoading) {
		return (
			<EmptyState
				title="Sin materias asignadas"
				description="Este curso aún no posee materias en su plan de estudio."
				actionLabel={canManage && onAddSubject ? 'Agregar Materia' : undefined}
				onAction={canManage ? onAddSubject : undefined}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold flex items-center gap-2">
					<BookOpen className="h-5 w-5 text-primary" />
					Materias del Curso ({subjects.length})
				</h3>
				{canManage && onAddSubject && (
					<Button onClick={onAddSubject} size="sm" className="gap-1.5">
						<Plus className="h-4 w-4" />
						Nueva Materia
					</Button>
				)}
			</div>

			<div className="rounded-md border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Materia</TableHead>
							<TableHead>Área</TableHead>
							<TableHead className="text-center">Horas Semanales</TableHead>
							<TableHead>Docente Asignado</TableHead>
							{canManage && <TableHead className="text-right">Acciones</TableHead>}
						</TableRow>
					</TableHeader>
					<TableBody>
						{subjects.map((subject) => (
							<TableRow key={subject.id}>
								<TableCell className="font-semibold text-foreground">
									{subject.name}
								</TableCell>
								<TableCell>
									<Badge variant="outline" className="font-normal">
										{subject.area}
									</Badge>
								</TableCell>
								<TableCell className="text-center font-mono">
									{subject.weeklyHours} hs
								</TableCell>
								<TableCell>
									{subject.teacherName ? (
										<span className="flex items-center gap-1.5 text-sm font-medium">
											<UserCheck className="h-4 w-4 text-emerald-600" />
											{subject.teacherName}
										</span>
									) : (
										<span className="text-sm text-muted-foreground italic">
											Sin docente asignado
										</span>
									)}
								</TableCell>
								{canManage && (
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											{onEditSubject && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onEditSubject(subject)}
												>
													<Edit className="h-4 w-4" />
												</Button>
											)}
											{onDeleteSubject && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onDeleteSubject(subject)}
													className="text-destructive hover:text-destructive"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									</TableCell>
								)}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
