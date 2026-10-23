import { DAYOFWEEK, SHIFT } from '@repo/common';
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
			const monday = new Date('2025-03-10T12:00:00'); // lunes
			const result = service.getSlotsForDate(monday, slots);
			expect(result).toHaveLength(2);
			expect(result.every((s) => s.dayOfWeek === DAYOFWEEK.MONDAY)).toBe(true);
		});

		it('should return empty when no slots match the day', () => {
			const wednesday = new Date('2025-03-12T12:00:00'); // miércoles
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
			startDate: new Date('2025-03-01T12:00:00'),
			endDate: new Date('2025-03-31T12:00:00'),
			nonWorkingDays: [new Date('2025-03-24T12:00:00')], // feriado
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
				new Date('2025-03-01T12:00:00'),
				new Date('2025-03-31T12:00:00'),
				academicYear,
			);
			// marzo 2025 tiene 21 días hábiles menos 1 feriado = 20
			expect(result).toHaveLength(20);
		});

		it('should exclude non working days when they come as ISO strings from the db', () => {
			const yearWithRawDates = AcademicYear.reconstitute({
				id: 'ay-1',
				tenantId: 'tenant-1',
				year: 2025,
				startDate: new Date('2025-03-01T12:00:00'),
				endDate: new Date('2025-03-31T12:00:00'),
				nonWorkingDays: ['2025-03-24T00:00:00.000Z'] as unknown as Date[],
				absenceThresholdPercent: 75,
				lateCountAbscenseAfterMinutes: 15,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			const result = service.getWorkingDaysOnPeriod(
				new Date('2025-03-01T12:00:00'),
				new Date('2025-03-31T12:00:00'),
				yearWithRawDates,
			);
			expect(result).toHaveLength(20);
			expect(result.some((d) => d.toISOString().startsWith('2025-03-24'))).toBe(
				false,
			);
		});

		it('reads weekdays and holidays of UTC-midnight dates in UTC, whatever the server timezone', () => {
			const year = AcademicYear.reconstitute({
				id: 'ay-2',
				tenantId: 'tenant-1',
				year: 2026,
				startDate: new Date('2026-03-02'),
				endDate: new Date('2026-03-13'),
				nonWorkingDays: ['2026-03-11'] as unknown as Date[],
				absenceThresholdPercent: 75,
				lateCountAbscenseAfterMinutes: 15,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			const result = service.getWorkingDaysOnPeriod(
				new Date('2026-03-07'), // Saturday, UTC midnight
				new Date('2026-03-13'), // Friday, UTC midnight
				year,
			);
			expect(result.map((d) => d.toISOString().slice(0, 10))).toEqual([
				'2026-03-09',
				'2026-03-10',
				'2026-03-12',
				'2026-03-13',
			]);
		});

		describe('shift-scoped non-working days', () => {
			const scopedYear = AcademicYear.reconstitute({
				id: 'ay-3',
				tenantId: 'tenant-1',
				year: 2026,
				startDate: new Date('2026-03-02'),
				endDate: new Date('2026-03-13'),
				nonWorkingDays: [new Date('2026-03-11'), new Date('2026-03-12')],
				nonWorkingDayShifts: { '2026-03-11': [SHIFT.MORNING] },
				absenceThresholdPercent: 75,
				lateCountAbscenseAfterMinutes: 15,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			const keys = (shift?: SHIFT) =>
				service
					.getWorkingDaysOnPeriod(
						new Date('2026-03-10'),
						new Date('2026-03-13'),
						scopedYear,
						shift,
					)
					.map((d) => d.toISOString().slice(0, 10));

			it('keeps a scoped day as working for courses of other shifts', () => {
				expect(keys(SHIFT.AFTERNOON)).toEqual([
					'2026-03-10',
					'2026-03-11',
					'2026-03-13',
				]);
			});

			it('drops a scoped day for courses of an affected shift', () => {
				expect(keys(SHIFT.MORNING)).toEqual(['2026-03-10', '2026-03-13']);
			});

			it('still drops the unscoped day for every shift', () => {
				expect(keys(SHIFT.EVENING)).not.toContain('2026-03-12');
			});

			it('drops every declared day when the course shift is unknown', () => {
				expect(keys()).toEqual(['2026-03-10', '2026-03-13']);
			});
		});

		it('should return empty when from equals to and is weekend', () => {
			const result = service.getWorkingDaysOnPeriod(
				new Date('2025-03-01T12:00:00'), // sábado
				new Date('2025-03-01T12:00:00'),
				academicYear,
			);
			expect(result).toHaveLength(0);
		});
	});
});
