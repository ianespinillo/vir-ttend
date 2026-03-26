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
					throw new Error(
						`Schedule overlap detected between ${slots[i].startTime}-${slots[i].endTime} and ${slots[j].startTime}-${slots[j].endTime} on ${slots[i].dayOfWeek}`,
					);
				}
			}
		}
	}
}
