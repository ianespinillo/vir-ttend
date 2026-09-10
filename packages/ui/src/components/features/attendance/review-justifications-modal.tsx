'use client';

import type { AttendanceRecord } from '@repo/common';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, FileCheck, Info } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { ScrollArea } from '../../../ui/scroll-area';
import { EmptyState } from '../../shared/empty-state';
import { LoadingSpinner } from '../../shared/loading-spinner';

export interface ReviewJustificationsModalProps {
	open: boolean;
	onClose: () => void;
	courseName?: string;
	selectedDate: string;
	justifiedRecords: AttendanceRecord[];
	isLoading?: boolean;
}

export function ReviewJustificationsModal({
	open,
	onClose,
	courseName,
	selectedDate,
	justifiedRecords,
	isLoading = false,
}: Readonly<ReviewJustificationsModalProps>) {
	const monthFormatted = selectedDate
		? format(parseISO(selectedDate), 'MMMM yyyy', { locale: es })
		: '';

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-2xl sm:max-w-3xl">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<FileCheck className="h-5 w-5 text-primary" />
						<DialogTitle className="text-xl">Justificaciones del Curso</DialogTitle>
					</div>
					<DialogDescription className="flex items-center gap-2 pt-1 text-sm">
						<span>
							Curso:{' '}
							<strong className="text-foreground">
								{courseName || 'Seleccionado'}
							</strong>
						</span>
						<span>•</span>
						<span className="capitalize">
							Período: <strong className="text-foreground">{monthFormatted}</strong>
						</span>
					</DialogDescription>
				</DialogHeader>

				<div className="py-2">
					{isLoading ? (
						<div className="flex h-48 items-center justify-center">
							<LoadingSpinner label="Cargando justificaciones del mes..." />
						</div>
					) : justifiedRecords.length === 0 ? (
						<EmptyState
							icon={<Info className="h-10 w-10 text-muted-foreground" />}
							title="Sin justificaciones"
							description={`No se encontraron asistencias justificadas para este curso en ${monthFormatted}.`}
						/>
					) : (
						<ScrollArea className="max-h-[50vh] pr-3">
							<div className="divide-y divide-border/60 rounded-lg border border-border/80 bg-card">
								{justifiedRecords.map((record) => {
									const rawDate = record.date ? String(record.date).slice(0, 10) : '';
									const dateFormatted = rawDate
										? format(parseISO(rawDate), 'dd/MM/yyyy')
										: '-';

									return (
										<div
											key={record.id}
											className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
										>
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="font-semibold text-foreground">
														{record.studentName}
													</span>
													<Badge
														variant="outline"
														className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs"
													>
														{record.status}
													</Badge>
												</div>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Calendar className="h-3.5 w-3.5" />
													<span>Fecha de inasistencia: {dateFormatted}</span>
												</div>
											</div>

											<div className="flex flex-col sm:items-end text-left sm:text-right gap-1 max-w-sm">
												<span className="text-xs font-semibold text-foreground">
													Motivo:{' '}
													<span className="font-normal text-muted-foreground">
														{record.justification?.reason || 'No especificado'}
													</span>
												</span>
												{record.justification?.notes && (
													<p className="text-xs text-muted-foreground italic bg-muted/60 p-1.5 rounded border border-border/40">
														"{record.justification.notes}"
													</p>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</ScrollArea>
					)}
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cerrar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
