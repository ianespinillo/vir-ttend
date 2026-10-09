import { DAYOFWEEK } from '@repo/common';
import { DomainError } from '../../../../src/common/errors/domain.error';
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

		it('debe lanzar DomainError cuando los slots se solapan', () => {
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

			expect(() => CourseService.validateScheduleOverlap(slots)).toThrow(
				DomainError,
			);
		});
	});

	describe('validateWeeklyHours', () => {
		const buildSlot = (
			subjectId: string,
			dayOfWeek: DAYOFWEEK,
			startTime: string,
			endTime: string,
		) =>
			ScheduleSlot.reconstitute({
				id: `${subjectId}-${startTime}`,
				subjectId,
				dayOfWeek,
				startTime,
				endTime,
				createdAt: new Date(),
			});

		it('should not throw when subject total is below weeklyHours', () => {
			const slots = [buildSlot('sub-1', DAYOFWEEK.MONDAY, '08:00', '10:00')]; // 2h
			const weeklyHours = new Map([['sub-1', 4]]);

			expect(() =>
				CourseService.validateWeeklyHours(slots, weeklyHours),
			).not.toThrow();
		});

		it('should not throw when subject total equals weeklyHours exactly', () => {
			const slots = [
				buildSlot('sub-1', DAYOFWEEK.MONDAY, '08:00', '10:00'), // 2h
				buildSlot('sub-1', DAYOFWEEK.TUESDAY, '08:00', '10:00'), // 2h
			]; // total 4h
			const weeklyHours = new Map([['sub-1', 4]]);

			expect(() =>
				CourseService.validateWeeklyHours(slots, weeklyHours),
			).not.toThrow();
		});

		it('should throw when subject total exceeds weeklyHours', () => {
			const slots = [
				buildSlot('sub-1', DAYOFWEEK.MONDAY, '08:00', '10:00'), // 2h
				buildSlot('sub-1', DAYOFWEEK.TUESDAY, '08:00', '10:00'), // 2h
				buildSlot('sub-1', DAYOFWEEK.WEDNESDAY, '08:00', '09:00'), // 1h -> 5h
			];
			const weeklyHours = new Map([['sub-1', 4]]);

			expect(() => CourseService.validateWeeklyHours(slots, weeklyHours)).toThrow(
				DomainError,
			);
		});

		it('should validate each subject independently', () => {
			const slots = [
				buildSlot('sub-1', DAYOFWEEK.MONDAY, '08:00', '10:00'), // sub-1: 2h (< 3)
				buildSlot('sub-2', DAYOFWEEK.MONDAY, '10:00', '13:00'), // sub-2: 3h (= 3)
			];
			const weeklyHours = new Map([
				['sub-1', 3],
				['sub-2', 3],
			]);

			expect(() =>
				CourseService.validateWeeklyHours(slots, weeklyHours),
			).not.toThrow();
		});
	});
});
