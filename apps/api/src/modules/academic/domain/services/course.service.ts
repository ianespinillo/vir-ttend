import { COMMISSION_NUMBERS, CommissionNumber, DAYOFWEEK } from '@repo/common';
import {
	BusinessRuleError,
	DomainError,
} from '../../../../common/errors/domain.error';
import { Course } from '../entities/course.entity';
import { ScheduleSlot } from '../entities/schedule-slot.entity';

const DAY_LABELS: Record<DAYOFWEEK, string> = {
	[DAYOFWEEK.MONDAY]: 'lunes',
	[DAYOFWEEK.TUESDAY]: 'martes',
	[DAYOFWEEK.WEDNESDAY]: 'miércoles',
	[DAYOFWEEK.THURSDAY]: 'jueves',
	[DAYOFWEEK.FRIDAY]: 'viernes',
};

export class CourseService {
	static calculateFulName(course: Course) {
		return `${course.yearNumber}° ${course.division} - ${course.shift[0].toUpperCase().concat(course.shift.slice(1))}`;
	}
	static validateScheduleOverlap(slots: ScheduleSlot[]) {
		for (let i = 0; i < slots.length; i++) {
			for (let j = i + 1; j < slots.length; j++) {
				if (slots[i].overlaps(slots[j])) {
					throw new BusinessRuleError(
						`Los horarios se superponen: ${slots[i].startTime}-${slots[i].endTime} y ${slots[j].startTime}-${slots[j].endTime} el ${DAY_LABELS[slots[i].dayOfWeek]}.`,
					);
				}
			}
		}
	}
	/** A commission number is only meaningful on slots of workshop subjects. */
	static validateCommissionSlots(
		slots: ScheduleSlot[],
		workshopSubjectIds: ReadonlySet<string>,
	): void {
		for (const slot of slots) {
			if (
				slot.commissionNumber !== null &&
				!workshopSubjectIds.has(slot.subjectId)
			) {
				throw new DomainError(
					'Solo las materias de taller pueden asignarse a una comisión.',
				);
			}
		}
	}

	/**
	 * Once a course has commissions, a slot can only target one of them (or
	 * both, with null). Courses without commissions yet are not restricted.
	 */
	static validateExistingCommissions(
		slots: ScheduleSlot[],
		existingCommissionNumbers: readonly CommissionNumber[],
	): void {
		if (existingCommissionNumbers.length === 0) return;
		for (const slot of slots) {
			if (
				slot.commissionNumber !== null &&
				!existingCommissionNumbers.includes(slot.commissionNumber)
			) {
				throw new DomainError(
					existingCommissionNumbers.length === 1
						? `El curso no tiene la comisión ${slot.commissionNumber}: tiene una sola comisión de taller.`
						: `El curso no tiene la comisión ${slot.commissionNumber}.`,
				);
			}
		}
	}

	/**
	 * Theory subjects: total minutes must fit in weeklyHours. Workshop subjects:
	 * the check applies per existing commission (slots for that commission plus
	 * slots for both), since each commission only attends its own slots.
	 * `commissionNumbers` lists the course's commissions; empty means none yet,
	 * which checks both possible numbers.
	 */
	static validateWeeklyHours(
		slots: ScheduleSlot[],
		weeklyHoursBySubjectId: Map<string, number>,
		workshopSubjectIds: ReadonlySet<string> = new Set(),
		commissionNumbers: readonly CommissionNumber[] = COMMISSION_NUMBERS,
	): void {
		const checkedCommissions =
			commissionNumbers.length > 0 ? commissionNumbers : COMMISSION_NUMBERS;
		const slotsBySubjectId = new Map<string, ScheduleSlot[]>();
		for (const slot of slots) {
			const list = slotsBySubjectId.get(slot.subjectId) ?? [];
			list.push(slot);
			slotsBySubjectId.set(slot.subjectId, list);
		}

		for (const [subjectId, subjectSlots] of slotsBySubjectId) {
			const weeklyHours = weeklyHoursBySubjectId.get(subjectId);
			if (weeklyHours === undefined) continue;
			const maxMinutes = weeklyHours * 60;

			if (!workshopSubjectIds.has(subjectId)) {
				const minutes = CourseService.sumMinutes(subjectSlots);
				if (minutes > maxMinutes) {
					throw new DomainError(
						`La materia supera sus horas semanales: ${CourseService.formatDuration(minutes)} asignadas (máximo ${weeklyHours} hs/sem).`,
					);
				}
				continue;
			}

			for (const commission of checkedCommissions) {
				const minutes = CourseService.sumMinutes(
					subjectSlots.filter(
						(s) => s.commissionNumber === null || s.commissionNumber === commission,
					),
				);
				if (minutes > maxMinutes) {
					throw new DomainError(
						`La materia supera sus horas semanales en la comisión ${commission}: ${CourseService.formatDuration(minutes)} asignadas (máximo ${weeklyHours} hs/sem).`,
					);
				}
			}
		}
	}

	private static sumMinutes(slots: ScheduleSlot[]): number {
		return slots.reduce(
			(total, slot) => total + CourseService.slotDurationInMinutes(slot),
			0,
		);
	}

	private static slotDurationInMinutes(slot: ScheduleSlot): number {
		return (
			CourseService.timeToMinutes(slot.endTime) -
			CourseService.timeToMinutes(slot.startTime)
		);
	}

	private static timeToMinutes(time: string): number {
		const [hours = 0, minutes = 0] = time.split(':').map(Number);
		return hours * 60 + minutes;
	}

	private static formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const remaining = minutes % 60;
		if (hours === 0) return `${remaining}m`;
		if (remaining === 0) return `${hours}h`;
		return `${hours}h ${remaining}m`;
	}
}
