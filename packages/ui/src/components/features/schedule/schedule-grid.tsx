'use client';

import {
	DAYOFWEEK,
	type IScheduleSlotResponse,
	type ISubjectResponse,
} from '@repo/common';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';

export interface ScheduleGridProps {
	slots: IScheduleSlotResponse[];
	subjects: ISubjectResponse[];
	onAddSlot?: (dayOfWeek?: DAYOFWEEK) => void;
	onDeleteSlot?: (slotId: string) => void;
	canManage?: boolean;
}

const DAYS: Array<{ key: DAYOFWEEK; label: string }> = [
	{ key: DAYOFWEEK.MONDAY, label: 'Lunes' },
	{ key: DAYOFWEEK.TUESDAY, label: 'Martes' },
	{ key: DAYOFWEEK.WEDNESDAY, label: 'Miércoles' },
	{ key: DAYOFWEEK.THURSDAY, label: 'Jueves' },
	{ key: DAYOFWEEK.FRIDAY, label: 'Viernes' },
];

const COLORS = [
	'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
	'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200',
	'bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200',
	'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200',
	'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200',
	'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-200',
	'bg-teal-50 border-teal-200 text-teal-900 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-200',
];

export function ScheduleGrid({
	slots,
	subjects,
	onAddSlot,
	onDeleteSlot,
	canManage = false,
}: ScheduleGridProps) {
	const subjectMap = new Map(subjects.map((s) => [s.id, s]));

	// Map colors to subject IDs deterministically
	const subjectColorMap = new Map<string, string>();
	subjects.forEach((s, idx) => {
		subjectColorMap.set(s.id, COLORS[idx % COLORS.length] ?? '');
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold flex items-center gap-2">
					<Clock className="h-5 w-5 text-primary" />
					Grilla Semanal de Horarios
				</h3>
				{canManage && onAddSlot && (
					<Button onClick={() => onAddSlot()} size="sm" className="gap-1.5">
						<Plus className="h-4 w-4" />
						Agregar Franja Horaria
					</Button>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				{DAYS.map((day) => {
					const daySlots = slots
						.filter((s) => s.dayOfWeek.toLowerCase() === day.key.toLowerCase())
						.sort((a, b) => a.startTime.localeCompare(b.startTime));

					return (
						<Card key={day.key} className="border shadow-sm flex flex-col">
							<CardHeader className="p-3 bg-muted/40 border-b text-center">
								<CardTitle className="text-sm font-bold uppercase tracking-wider">
									{day.label}
								</CardTitle>
							</CardHeader>
							<CardContent className="p-3 space-y-3 flex-1 flex flex-col">
								{daySlots.length === 0 ? (
									<div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground italic border-2 border-dashed rounded-md">
										Sin clases
									</div>
								) : (
									daySlots.map((slot) => {
										const subject = subjectMap.get(slot.subjectId);
										const colorClass = subjectColorMap.get(slot.subjectId) || COLORS[0];

										return (
											<div
												key={slot.id || `${slot.dayOfWeek}-${slot.startTime}`}
												className={`p-2.5 rounded-lg border text-xs relative group space-y-1 shadow-2xs transition-all ${colorClass}`}
											>
												<div className="flex items-center justify-between font-semibold">
													<span>
														{slot.startTime} - {slot.endTime}
													</span>
													{canManage && onDeleteSlot && slot.id && (
														<button
															type="button"
															onClick={() => onDeleteSlot(slot.id)}
															className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive p-0.5 rounded"
															title="Eliminar franja"
														>
															<Trash2 className="h-3.5 w-3.5" />
														</button>
													)}
												</div>
												<p className="font-bold text-sm">
													{subject?.name || 'Materia desconocida'}
												</p>
												{subject?.teacherName && (
													<p className="text-[11px] opacity-80">
														Prof. {subject.teacherName}
													</p>
												)}
											</div>
										);
									})
								)}

								{canManage && onAddSlot && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onAddSlot(day.key)}
										className="w-full text-xs text-muted-foreground border border-dashed hover:border-primary/40 mt-auto"
									>
										+ Añadir a {day.label}
									</Button>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
