'use client';

import type { IAcademicYearResponse } from '@repo/common';
import { Calendar, Clock, Edit, ShieldAlert } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';

export interface AcademicYearCardProps {
	academicYear: IAcademicYearResponse;
	onEdit?: (year: IAcademicYearResponse) => void;
	canEdit?: boolean;
}

export function AcademicYearCard({
	academicYear,
	onEdit,
	canEdit = true,
}: AcademicYearCardProps) {
	const startDateFormatted = new Date(academicYear.startDate).toLocaleDateString(
		'es-AR',
		{ day: '2-digit', month: '2-digit', year: 'numeric' },
	);
	const endDateFormatted = new Date(academicYear.endDate).toLocaleDateString(
		'es-AR',
		{ day: '2-digit', month: '2-digit', year: 'numeric' },
	);

	return (
		<Card className="shadow-sm border hover:border-primary/50 transition-colors">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-xl font-bold flex items-center gap-2">
					Ciclo Lectivo {academicYear.year}
					{academicYear.isActive ? (
						<Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
							Activo
						</Badge>
					) : (
						<Badge variant="outline" className="text-muted-foreground">
							Inactivo / Cerrado
						</Badge>
					)}
				</CardTitle>
				{canEdit && onEdit && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(academicYear)}
						className="gap-1 text-muted-foreground hover:text-foreground"
					>
						<Edit className="h-4 w-4" />
						Editar
					</Button>
				)}
			</CardHeader>
			<CardContent className="space-y-4 pt-2">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Calendar className="h-4 w-4 text-primary" />
						<span>
							Inicio: <strong className="text-foreground">{startDateFormatted}</strong>
						</span>
					</div>
					<div className="flex items-center gap-2 text-muted-foreground">
						<Calendar className="h-4 w-4 text-primary" />
						<span>
							Fin: <strong className="text-foreground">{endDateFormatted}</strong>
						</span>
					</div>
					<div className="flex items-center gap-2 text-muted-foreground">
						<ShieldAlert className="h-4 w-4 text-amber-500" />
						<span>
							Umbral Inasistencias:{' '}
							<strong className="text-foreground">
								{academicYear.absenceThresholdPercent}%
							</strong>
						</span>
					</div>
					<div className="flex items-center gap-2 text-muted-foreground">
						<Clock className="h-4 w-4 text-blue-500" />
						<span>
							Tolerancia Tardanza:{' '}
							<strong className="text-foreground">
								{academicYear.lateCountAbscenseAfterMinutes} min
							</strong>
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
