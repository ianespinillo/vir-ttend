import { DomainError } from '../../../../common/errors/domain.error';
import { Course } from '../entities/course.entity';
import { ScheduleSlot } from '../entities/schedule-slot.entity';

export class CourseService {
	static calculateFulName(course: Course) {
		return `${course.yearNumber}° ${course.division} - ${course.shift[0].toUpperCase().concat(course.shift.slice(1))}`;
	}
	static validateScheduleOverlap(slots: ScheduleSlot[]) {
		for (let i = 0; i < slots.length; i++) {
			for (let j = i + 1; j < slots.length; j++) {
				if (slots[i].overlaps(slots[j])) {
					throw new DomainError(
						`Schedule overlap detected between ${slots[i].startTime}-${slots[i].endTime} and ${slots[j].startTime}-${slots[j].endTime} on ${slots[i].dayOfWeek}`,
					);
				}
			}
		}
	}
	static validateWeeklyHours(
		slots: ScheduleSlot[],
		weeklyHoursBySubjectId: Map<string, number>,
	): void {
		const minutesBySubjectId = new Map<string, number>();
		for (const slot of slots) {
			const duration = CourseService.slotDurationInMinutes(slot);
			minutesBySubjectId.set(
				slot.subjectId,
				(minutesBySubjectId.get(slot.subjectId) ?? 0) + duration,
			);
		}

		for (const [subjectId, minutes] of minutesBySubjectId) {
			const weeklyHours = weeklyHoursBySubjectId.get(subjectId);
			if (weeklyHours === undefined) continue;
			if (minutes > weeklyHours * 60) {
				throw new DomainError(
					`La materia supera sus horas semanales: ${CourseService.formatDuration(minutes)} asignadas (máximo ${weeklyHours} hs/sem).`,
				);
			}
		}
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
