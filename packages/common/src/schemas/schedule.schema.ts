import { z } from 'zod';
import { DAYOFWEEK } from '../constants/day-of-week.enum.js';

export const scheduleSlotSchema = z
	.object({
		id: z.string().optional(),
		subjectId: z.string().min(1, 'Seleccione una materia'),
		dayOfWeek: z.nativeEnum(DAYOFWEEK, {
			errorMap: () => ({ message: 'Seleccione un día válido' }),
		}),
		startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
			message: 'Hora de inicio inválida (HH:mm)',
		}),
		endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
			message: 'Hora de fin inválida (HH:mm)',
		}),
		commissionNumber: z
			.union([z.literal(1), z.literal(2)])
			.nullable()
			.optional(),
	})
	.refine((data) => data.startTime < data.endTime, {
		message: 'La hora de fin debe ser posterior a la hora de inicio',
		path: ['endTime'],
	});

export const setScheduleSchema = z.object({
	courseId: z.string().uuid('Debe indicar un curso válido'),
	slots: z.array(scheduleSlotSchema),
});

export type ScheduleSlotFormValues = z.infer<typeof scheduleSlotSchema>;
export type SetScheduleFormValues = z.infer<typeof setScheduleSchema>;

interface OverlapSlot {
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	commissionNumber?: number | null;
}

/** Two slots can share students when either covers both commissions (null) or they match. */
const canShareStudents = (a: OverlapSlot, b: OverlapSlot): boolean =>
	a.commissionNumber == null ||
	b.commissionNumber == null ||
	a.commissionNumber === b.commissionNumber;

/**
 * Validates whether a list of schedule slots contains any overlapping time slots on the same day.
 * Slots of different workshop commissions (1 vs 2) may run at the same time.
 * Returns true if overlapping, false otherwise.
 */
export function checkScheduleOverlap(slots: OverlapSlot[]): boolean {
	const byDay = new Map<string, OverlapSlot[]>();

	for (const slot of slots) {
		const existing = byDay.get(slot.dayOfWeek) || [];
		existing.push(slot);
		byDay.set(slot.dayOfWeek, existing);
	}

	for (const [, daySlots] of byDay) {
		for (let i = 0; i < daySlots.length; i++) {
			for (let j = i + 1; j < daySlots.length; j++) {
				const a = daySlots[i];
				const b = daySlots[j];
				if (
					a &&
					b &&
					a.startTime < b.endTime &&
					b.startTime < a.endTime &&
					canShareStudents(a, b)
				) {
					return true;
				}
			}
		}
	}
	return false;
}
