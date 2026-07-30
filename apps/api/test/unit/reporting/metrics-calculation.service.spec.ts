import type { AttendanceStatus } from '@repo/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { AttendanceRecord } from '../../../src/modules/reporting/domain/entities/attendance-record.entity';
import { MetricsCalculationService } from '../../../src/modules/reporting/domain/services/metrics-calculation.service';

const makeRecord = (
	status: AttendanceStatus,
	date?: string,
): AttendanceRecord =>
	AttendanceRecord.reconstitute({
		id: `rec-${Math.random().toString(36).slice(2)}`,
		studentId: 'student-1',
		courseId: 'course-1',
		date: new Date(date ?? '2026-07-01'),
		status,
	});

describe('MetricsCalculationService', () => {
	let service: MetricsCalculationService;

	beforeEach(() => {
		service = new MetricsCalculationService();
	});

	describe('calculateStudentMetrics', () => {
		it('retorna todo en 0 cuando no hay registros', () => {
			const result = service.calculateStudentMetrics([]);
			expect(result.present).toBe(0);
			expect(result.absent).toBe(0);
			expect(result.late).toBe(0);
			expect(result.justified).toBe(0);
			expect(result.absencePercent).toBe(0);
			expect(result.status).toBe('ok');
		});

		it('cuenta correctamente los estados de asistencia', () => {
			const records = [
				makeRecord(ATTENDANCE_STATUS.PRESENT),
				makeRecord(ATTENDANCE_STATUS.PRESENT),
				makeRecord(ATTENDANCE_STATUS.ABSENT),
				makeRecord(ATTENDANCE_STATUS.LATE),
				makeRecord(ATTENDANCE_STATUS.JUSTIFIED),
			];
			const result = service.calculateStudentMetrics(records);
			expect(result.present).toBe(2);
			expect(result.absent).toBe(1);
			expect(result.late).toBe(1);
			expect(result.justified).toBe(1);
		});

		describe('umbrales de absencePercent', () => {
			it('absencePercent < 50 → status ok', () => {
				const records = Array.from({ length: 10 }, () =>
					makeRecord(ATTENDANCE_STATUS.PRESENT),
				);
				const result = service.calculateStudentMetrics(records);
				expect(result.absencePercent).toBe(0);
				expect(result.status).toBe('ok');
			});

			it('absencePercent 50-74 → status at-risk', () => {
				const records = [
					...Array.from({ length: 5 }, () => makeRecord(ATTENDANCE_STATUS.PRESENT)),
					...Array.from({ length: 5 }, () => makeRecord(ATTENDANCE_STATUS.ABSENT)),
				];
				const result = service.calculateStudentMetrics(records);
				expect(result.absencePercent).toBe(50);
				expect(result.status).toBe('at-risk');
			});

			it('absencePercent >= 75 → status exceeded', () => {
				const records = [
					...Array.from({ length: 2 }, () => makeRecord(ATTENDANCE_STATUS.PRESENT)),
					...Array.from({ length: 8 }, () => makeRecord(ATTENDANCE_STATUS.ABSENT)),
				];
				const result = service.calculateStudentMetrics(records);
				expect(result.absencePercent).toBe(80);
				expect(result.status).toBe('exceeded');
			});
		});

		it('absencePercent = 100 → status exceeded', () => {
			const records = Array.from({ length: 5 }, () =>
				makeRecord(ATTENDANCE_STATUS.ABSENT),
			);
			const result = service.calculateStudentMetrics(records);
			expect(result.absencePercent).toBe(100);
			expect(result.status).toBe('exceeded');
		});

		it('absencePercent en el límite 49.99 → ok', () => {
			const result = service.calculateStudentMetrics([
				makeRecord(ATTENDANCE_STATUS.PRESENT),
				makeRecord(ATTENDANCE_STATUS.PRESENT),
				makeRecord(ATTENDANCE_STATUS.ABSENT),
			]);
			expect(result.absencePercent).toBeCloseTo(33.33, 1);
			expect(result.status).toBe('ok');
		});
	});
});
