import { DAYOFWEEK } from '@repo/common';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { CourseService } from '../../../../src/modules/academic/domain/services/course.service';

// course.service.spec.ts
describe('CourseService', () => {
	describe('validateScheduleOverlap', () => {
		it('should not throw when slots do not overlap', () => {
			const slots = [
				ScheduleSlot.reconstitute({
					id: '1',
					subjectId: 'sub-1',
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '08:00',
					endTime: '09:00',
					createdAt: new Date(),
				}),
				ScheduleSlot.reconstitute({
					id: '2',
					subjectId: 'sub-2',
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '09:00',
					endTime: '10:00',
					createdAt: new Date(),
				}),
			];

			expect(() => CourseService.validateScheduleOverlap(slots)).not.toThrow();
		});

		it('should not throw when slots are on different days', () => {
			const slots = [
				ScheduleSlot.reconstitute({
					id: '1',
					subjectId: 'sub-1',
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '08:00',
					endTime: '10:00',
					createdAt: new Date(),
				}),
				ScheduleSlot.reconstitute({
					id: '2',
					subjectId: 'sub-2',
					dayOfWeek: DAYOFWEEK.TUESDAY,
					startTime: '08:00',
					endTime: '10:00',
					createdAt: new Date(),
				}),
			];

			expect(() => CourseService.validateScheduleOverlap(slots)).not.toThrow();
		});

		it('should throw when slots overlap on same day', () => {
			const slots = [
				ScheduleSlot.reconstitute({
					id: '1',
					subjectId: 'sub-1',
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '08:00',
					endTime: '10:00',
					createdAt: new Date(),
				}),
				ScheduleSlot.reconstitute({
					id: '2',
					subjectId: 'sub-2',
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '09:00',
					endTime: '11:00',
					createdAt: new Date(),
				}),
			];

			expect(() => CourseService.validateScheduleOverlap(slots)).toThrow();
		});

		it('should throw when one slot contains another', () => {
			const slots = [
				ScheduleSlot.reconstitute({
					id: '1',
					subjectId: 'sub-1',
					dayOfWeek: DAYOFWEEK.WEDNESDAY,
					startTime: '08:00',
					endTime: '12:00',
					createdAt: new Date(),
				}),
				ScheduleSlot.reconstitute({
					id: '2',
					subjectId: 'sub-2',
					dayOfWeek: DAYOFWEEK.WEDNESDAY,
					startTime: '09:00',
					endTime: '10:00',
					createdAt: new Date(),
				}),
			];

			expect(() => CourseService.validateScheduleOverlap(slots)).toThrow();
		});

		it('should not throw with empty slots', () => {
			expect(() => CourseService.validateScheduleOverlap([])).not.toThrow();
		});

		it('should not throw with single slot', () => {
			const slots = [
				ScheduleSlot.reconstitute({
					id: '1',
					subjectId: 'sub-1',
					dayOfWeek: DAYOFWEEK.FRIDAY,
					startTime: '08:00',
					endTime: '09:00',
					createdAt: new Date(),
				}),
			];

			expect(() => CourseService.validateScheduleOverlap(slots)).not.toThrow();
		});
	});
});
