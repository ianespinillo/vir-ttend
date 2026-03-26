import { DAYOFWEEK } from '@repo/common';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { ScheduleService } from '../../../../src/modules/academic/domain/services/schedule.service';
// schedule.service.spec.ts
describe('ScheduleService', () => {
	let service: ScheduleService;

	beforeEach(() => {
		service = new ScheduleService();
	});

	describe('getSlotsForDate', () => {
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
				dayOfWeek: DAYOFWEEK.TUESDAY,
				startTime: '08:00',
				endTime: '09:00',
				createdAt: new Date(),
			}),
			ScheduleSlot.reconstitute({
				id: '3',
				subjectId: 'sub-1',
				dayOfWeek: DAYOFWEEK.MONDAY,
				startTime: '10:00',
				endTime: '11:00',
				createdAt: new Date(),
			}),
		];

		it('should return slots for the given day', () => {
			const monday = new Date('2025-03-10'); // lunes
			const result = service.getSlotsForDate(monday, slots);
			expect(result).toHaveLength(2);
			expect(result.every((s) => s.dayOfWeek === DAYOFWEEK.MONDAY)).toBe(true);
		});

		it('should return empty when no slots match the day', () => {
			const wednesday = new Date('2025-03-12'); // miércoles
			const result = service.getSlotsForDate(wednesday, slots);
			expect(result).toHaveLength(0);
		});

		it('should return empty when slots array is empty', () => {
			const monday = new Date('2025-03-10');
			const result = service.getSlotsForDate(monday, []);
			expect(result).toHaveLength(0);
		});
	});

	describe('getWorkingDaysOnPeriod', () => {
		const academicYear = AcademicYear.reconstitute({
			id: 'ay-1',
			tenantId: 'tenant-1',
			year: 2025,
			startDate: new Date('2025-03-01'),
			endDate: new Date('2025-03-31'),
			nonWorkingDays: [new Date('2025-03-24')], // feriado
			absenceThresholdPercent: 75,
			lateCountAbscenseAfterMinutes: 15,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		it('should exclude weekends', () => {
			const result = service.getWorkingDaysOnPeriod(
				new Date('2025-03-01'),
				new Date('2025-03-07'),
				academicYear,
			);
			// 01 sab, 02 dom, 03 lun, 04 mar, 05 mie, 06 jue, 07 vie
			expect(result).toHaveLength(5);
		});

		it('should exclude non working days', () => {
			const result = service.getWorkingDaysOnPeriod(
				new Date('2025-03-24'),
				new Date('2025-03-24'),
				academicYear,
			);
			expect(result).toHaveLength(0);
		});

		it('should return correct working days in full month', () => {
			const result = service.getWorkingDaysOnPeriod(
				new Date('2025-03-01'),
				new Date('2025-03-31'),
				academicYear,
			);
			// marzo 2025 tiene 21 días hábiles menos 1 feriado = 20
			expect(result).toHaveLength(20);
		});

		it('should return empty when from equals to and is weekend', () => {
			const result = service.getWorkingDaysOnPeriod(
				new Date('2025-03-01'), // sábado
				new Date('2025-03-01'),
				academicYear,
			);
			expect(result).toHaveLength(0);
		});
	});
});
