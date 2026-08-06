'use client';

import type {
	DAYOFWEEK,
	IScheduleSlotResponse,
	ISubjectResponse,
	ScheduleSlotFormValues,
} from '@repo/common';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { ScheduleForm } from './schedule-form';

export interface ScheduleModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subjects: ISubjectResponse[];
	existingSlots?: IScheduleSlotResponse[];
	defaultDay?: DAYOFWEEK;
	onSubmit: (slot: ScheduleSlotFormValues) => Promise<void> | void;
	isLoading?: boolean;
}

export function ScheduleModal({
	open,
	onOpenChange,
	subjects,
	existingSlots = [],
	defaultDay,
	onSubmit,
	isLoading = false,
}: ScheduleModalProps) {
	const handleSubmit = async (slot: ScheduleSlotFormValues) => {
		await onSubmit(slot);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader>
					<DialogTitle>Nueva Franja Horaria</DialogTitle>
					<DialogDescription>
						Asigne una materia a un día y horario específico dentro de la grilla del
						curso.
					</DialogDescription>
				</DialogHeader>

				<ScheduleForm
					subjects={subjects}
					existingSlots={existingSlots}
					defaultDay={defaultDay}
					onSubmit={handleSubmit}
					onCancel={() => onOpenChange(false)}
					isLoading={isLoading}
				/>
			</DialogContent>
		</Dialog>
	);
}
