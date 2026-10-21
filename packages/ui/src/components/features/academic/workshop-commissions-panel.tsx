'use client';

import type {
	CommissionCount,
	IUserResponse,
	IWorkshopCommissionResponse,
} from '@repo/common';
import { ArrowRightLeft, RefreshCw, Wrench } from 'lucide-react';
import { useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../../../ui/alert-dialog';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';

const NO_PRECEPTOR = 'NONE';

export interface WorkshopCommissionsPanelProps {
	commissions: IWorkshopCommissionResponse[];
	preceptors?: IUserResponse[];
	isLoading?: boolean;
	/** Disables every action while a request is in flight. */
	isBusy?: boolean;
	/** Creates the course's commissions: 1 (everyone together) or 2 (50/50). */
	onCreate: (count: CommissionCount) => void;
	/** Omitted when the viewer may not assign commission preceptors (admin and course preceptor only). */
	onAssignPreceptor?: (commissionId: string, preceptorId: string | null) => void;
	/** Moves the student to the commission identified by `commissionId`. */
	onMoveStudent: (commissionId: string, studentId: string) => void;
	onRegenerate: () => void;
}

export function WorkshopCommissionsPanel({
	commissions,
	preceptors = [],
	isLoading = false,
	isBusy = false,
	onCreate,
	onAssignPreceptor,
	onMoveStudent,
	onRegenerate,
}: WorkshopCommissionsPanelProps) {
	const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

	if (isLoading) {
		return (
			<p className="text-sm text-muted-foreground">Cargando comisiones...</p>
		);
	}

	if (commissions.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold flex items-center gap-2">
						<Wrench className="h-5 w-5 text-primary" />
						Comisiones de taller
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Las comisiones son opcionales. Solo se usan en cursos con taller en
						contraturno, que asisten al taller en una o dos comisiones, cada una con
						su preceptor de taller.
					</p>
					<p className="text-sm text-muted-foreground">
						Con dos comisiones, los estudiantes se reparten en orden alfabético por
						apellido (mitad y mitad) y después puede moverlos entre comisiones. Con
						una sola comisión, todos los estudiantes del curso pertenecen a ella.
					</p>
					<div className="flex flex-wrap gap-2">
						<Button onClick={() => onCreate(2)} disabled={isBusy}>
							Crear 2 comisiones
						</Button>
						<Button variant="outline" onClick={() => onCreate(1)} disabled={isBusy}>
							Crear 1 comisión
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	const sorted = [...commissions].sort((a, b) => a.number - b.number);
	const isSingle = sorted.length === 1;

	return (
		<div className="space-y-4">
			{isSingle ? (
				<p className="text-sm text-muted-foreground">
					El curso tiene una sola comisión de taller: todos sus estudiantes
					pertenecen a ella, incluidos los que se incorporen después.
				</p>
			) : (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<p className="text-sm text-muted-foreground">
						Cada estudiante pertenece a una sola comisión. El reparto inicial es
						alfabético y no cambia solo cuando llegan nuevos estudiantes.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5 shrink-0"
						onClick={() => setConfirmingRegenerate(true)}
						disabled={isBusy}
					>
						<RefreshCw className="h-4 w-4" />
						Regenerar reparto
					</Button>
				</div>
			)}

			<div
				className={`grid grid-cols-1 gap-6 ${isSingle ? '' : 'md:grid-cols-2'}`}
			>
				{sorted.map((commission) => {
					const other = sorted.find((c) => c.id !== commission.id);
					return (
						<Card key={commission.id}>
							<CardHeader>
								<CardTitle className="text-lg font-semibold">
									Comisión {commission.code}
									<span className="ml-2 text-sm font-normal text-muted-foreground">
										{commission.studentCount}{' '}
										{commission.studentCount === 1 ? 'estudiante' : 'estudiantes'}
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{onAssignPreceptor && (
									<div className="space-y-1">
										<span className="text-xs text-muted-foreground uppercase font-medium">
											Preceptor de taller
										</span>
										<Select
											value={commission.preceptorId ?? NO_PRECEPTOR}
											onValueChange={(value) =>
												onAssignPreceptor(
													commission.id,
													value === NO_PRECEPTOR ? null : value,
												)
											}
											disabled={isBusy}
										>
											<SelectTrigger
												aria-label={`Preceptor de la comisión ${commission.code}`}
											>
												<SelectValue placeholder="Seleccione preceptor" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={NO_PRECEPTOR}>Sin preceptor asignado</SelectItem>
												{preceptors.map((p) => (
													<SelectItem key={p.id} value={p.id}>
														{p.firstName} {p.lastName} ({p.email})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}

								{commission.students.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Sin estudiantes en esta comisión.
									</p>
								) : (
									<ul className="divide-y text-sm">
										{commission.students.map((student) => (
											<li
												key={student.id}
												className="flex items-center justify-between gap-2 py-1.5"
											>
												<span>
													{student.lastName}, {student.firstName}
												</span>
												{other && (
													<Button
														variant="ghost"
														size="sm"
														className="gap-1.5"
														disabled={isBusy}
														aria-label={`Mover a ${student.lastName}, ${student.firstName} a la comisión ${other.code}`}
														onClick={() => onMoveStudent(other.id, student.id)}
													>
														<ArrowRightLeft className="h-3.5 w-3.5" />
														Mover a {other.code}
													</Button>
												)}
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>

			<AlertDialog
				open={confirmingRegenerate}
				onOpenChange={setConfirmingRegenerate}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Regenerar el reparto?</AlertDialogTitle>
						<AlertDialogDescription>
							Se volverá a dividir el curso en orden alfabético (mitad y mitad) y se
							moverán estudiantes entre comisiones, descartando los movimientos
							manuales. El historial de asistencia se conserva con cada estudiante.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setConfirmingRegenerate(false);
								onRegenerate();
							}}
						>
							Sí, regenerar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
