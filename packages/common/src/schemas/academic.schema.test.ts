import { describe, expect, it } from 'vitest';
import { DAYOFWEEK } from '../constants/day-of-week.enum.js';
import { LEVEL } from '../constants/level.enum.js';
import { SHIFT } from '../constants/shift.enum.js';
import { createAcademicYearSchema } from './academic-year.schema.js';
import { createCourseSchema } from './course.schema.js';
import { checkScheduleOverlap, scheduleSlotSchema } from './schedule.schema.js';
import { createSubjectSchema } from './subject.schema.js';

describe('academic schemas', () => {
	const validUUID = '123e4567-e89b-12d3-a456-426614174000';

	it('valida un año lectivo válido', () => {
		const result = createAcademicYearSchema.safeParse({
			year: 2026,
			startDate: '2026-03-01',
			endDate: '2026-12-15',
			absenceThresholdPercent: 15,
			lateCountAbscenseAfterMinutes: 15,
		});
		expect(result.success).toBe(true);
	});

	it('valida un curso válido', () => {
		const result = createCourseSchema.safeParse({
			academicYearId: validUUID,
			level: LEVEL.SECONDARY,
			yearNumber: 1,
			division: 'A',
			shift: SHIFT.MORNING,
			schoolId: validUUID,
		});
		expect(result.success).toBe(true);
	});

	it('valida una materia válida', () => {
		const result = createSubjectSchema.safeParse({
			courseId: validUUID,
			name: 'Matemática',
			area: 'Ciencias Exactas',
			weeklyHours: 4,
		});
		expect(result.success).toBe(true);
	});

	it('valida franja horaria e inhabilita hora fin anterior a hora inicio', () => {
		const validSlot = scheduleSlotSchema.safeParse({
			subjectId: 'sub-1',
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '08:00',
			endTime: '09:20',
		});
		expect(validSlot.success).toBe(true);

		const invalidSlot = scheduleSlotSchema.safeParse({
			subjectId: 'sub-1',
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '10:00',
			endTime: '09:00',
		});
		expect(invalidSlot.success).toBe(false);
	});

	it('detecta solapamiento de franjas horarias con checkScheduleOverlap', () => {
		const slots = [
			{ dayOfWeek: 'monday', startTime: '08:00', endTime: '09:20' },
			{ dayOfWeek: 'monday', startTime: '09:00', endTime: '10:20' },
		];
		expect(checkScheduleOverlap(slots)).toBe(true);

		const nonOverlapping = [
			{ dayOfWeek: 'monday', startTime: '08:00', endTime: '09:20' },
			{ dayOfWeek: 'monday', startTime: '09:20', endTime: '10:40' },
			{ dayOfWeek: 'tuesday', startTime: '08:00', endTime: '09:20' },
		];
		expect(checkScheduleOverlap(nonOverlapping)).toBe(false);
	});
});
