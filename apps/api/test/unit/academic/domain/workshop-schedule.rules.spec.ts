import { CommissionNumber, DAYOFWEEK } from '@repo/common';
import { DomainError } from '../../../../src/common/errors/domain.error';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { CourseService } from '../../../../src/modules/academic/domain/services/course.service';

const slot = (
	subjectId: string,
	startTime: string,
	endTime: string,
	commissionNumber?: CommissionNumber | null,
	dayOfWeek: DAYOFWEEK = DAYOFWEEK.MONDAY,
) =>
	ScheduleSlot.create({
		subjectId,
		courseId: 'course-1',
		dayOfWeek,
		startTime,
		endTime,
		commissionNumber,
	});

describe('Workshop schedule rules', () => {
	describe('ScheduleSlot', () => {
		it('defaults commissionNumber to null (both commissions)', () => {
			expect(slot('w', '08:00', '09:00').commissionNumber).toBeNull();
		});

		it('rejects a commission number other than 1 or 2', () => {
			const create = () => slot('w', '08:00', '09:00', 3 as unknown as 1);
			expect(create).toThrow(DomainError);
			expect(create).toThrow('La comisión debe ser 1 o 2.');
		});
	});

	describe('validateCommissionSlots', () => {
		it('rejects a commission number on a theory subject slot', () => {
			expect(() =>
				CourseService.validateCommissionSlots(
					[slot('theory', '08:00', '09:00', 1)],
					new Set(['workshop']),
				),
			).toThrow(DomainError);
		});

		it('accepts a commission number on a workshop subject slot', () => {
			expect(() =>
				CourseService.validateCommissionSlots(
					[slot('workshop', '08:00', '09:00', 2)],
					new Set(['workshop']),
				),
			).not.toThrow();
		});

		it('accepts slots without commission on theory subjects', () => {
			expect(() =>
				CourseService.validateCommissionSlots(
					[slot('theory', '08:00', '09:00')],
					new Set(),
				),
			).not.toThrow();
		});
	});

	describe('validateScheduleOverlap', () => {
		it('allows simultaneous slots for commission 1 and commission 2', () => {
			expect(() =>
				CourseService.validateScheduleOverlap([
					slot('w1', '08:00', '10:00', 1),
					slot('w2', '08:00', '10:00', 2),
				]),
			).not.toThrow();
		});

		it('rejects overlap between a whole-course slot and a commission slot', () => {
			expect(() =>
				CourseService.validateScheduleOverlap([
					slot('theory', '08:00', '10:00', null),
					slot('w1', '09:00', '11:00', 1),
				]),
			).toThrow(DomainError);
		});

		it('rejects overlap between two slots of the same commission', () => {
			expect(() =>
				CourseService.validateScheduleOverlap([
					slot('w1', '08:00', '10:00', 2),
					slot('w2', '09:00', '11:00', 2),
				]),
			).toThrow(DomainError);
		});

		it('still allows adjacent slots of the same commission', () => {
			expect(() =>
				CourseService.validateScheduleOverlap([
					slot('w1', '08:00', '10:00', 1),
					slot('w2', '10:00', '12:00', 1),
				]),
			).not.toThrow();
		});
	});

	describe('validateExistingCommissions', () => {
		it('rejects a slot for commission 2 when the course only has commission 1', () => {
			const validate = () =>
				CourseService.validateExistingCommissions(
					[slot('w', '08:00', '09:00', 2)],
					[1],
				);
			expect(validate).toThrow(DomainError);
			expect(validate).toThrow(
				'El curso no tiene la comisión 2: tiene una sola comisión de taller.',
			);
		});

		it('accepts slots for existing commissions or for both', () => {
			expect(() =>
				CourseService.validateExistingCommissions(
					[slot('w', '08:00', '09:00', 1), slot('w', '09:00', '10:00', null)],
					[1],
				),
			).not.toThrow();
			expect(() =>
				CourseService.validateExistingCommissions(
					[slot('w', '08:00', '09:00', 1), slot('w', '08:00', '09:00', 2)],
					[1, 2],
				),
			).not.toThrow();
		});

		it('does not restrict courses without commissions yet', () => {
			expect(() =>
				CourseService.validateExistingCommissions(
					[slot('w', '08:00', '09:00', 2)],
					[],
				),
			).not.toThrow();
		});
	});

	describe('validateWeeklyHours', () => {
		const hours = new Map([['workshop', 4]]);
		const workshops = new Set(['workshop']);

		it('checks each commission separately for workshop subjects', () => {
			// 4h for commission 1 and 4h for commission 2: 8h in total, 4h each.
			const slots = [
				slot('workshop', '08:00', '12:00', 1, DAYOFWEEK.MONDAY),
				slot('workshop', '08:00', '12:00', 2, DAYOFWEEK.TUESDAY),
			];
			expect(() =>
				CourseService.validateWeeklyHours(slots, hours, workshops),
			).not.toThrow();
		});

		it('counts whole-course slots for both commissions', () => {
			const slots = [
				slot('workshop', '08:00', '10:00', null, DAYOFWEEK.MONDAY),
				slot('workshop', '08:00', '11:00', 1, DAYOFWEEK.TUESDAY),
			];
			// commission 1 = 2h + 3h = 5h > 4h
			expect(() =>
				CourseService.validateWeeklyHours(slots, hours, workshops),
			).toThrow(/comisión 1/);
		});

		it('rejects when only one commission exceeds the weekly hours', () => {
			const slots = [
				slot('workshop', '08:00', '12:00', 1, DAYOFWEEK.MONDAY),
				slot('workshop', '08:00', '10:00', 2, DAYOFWEEK.TUESDAY),
				slot('workshop', '10:00', '13:00', 2, DAYOFWEEK.TUESDAY),
			];
			expect(() =>
				CourseService.validateWeeklyHours(slots, hours, workshops),
			).toThrow(/comisión 2/);
		});

		it('keeps summing every slot for theory subjects', () => {
			const slots = [
				slot('theory', '08:00', '10:00', null, DAYOFWEEK.MONDAY),
				slot('theory', '08:00', '11:00', null, DAYOFWEEK.TUESDAY),
			];
			expect(() =>
				CourseService.validateWeeklyHours(slots, new Map([['theory', 4]])),
			).toThrow(DomainError);
		});
	});
});
