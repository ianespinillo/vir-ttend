import { mock } from 'jest-mock-extended';
import {
	ConflictError,
	DomainError,
	NotFoundError,
} from '../../../src/common/errors';
import { IAcademicYearRepository } from '../../../src/modules/academic/domain/repositories/academic-year.repository.interface';
import { IScheduleRepository } from '../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ScheduleService } from '../../../src/modules/academic/domain/services/schedule.service';
import { AttendanceAlert } from '../../../src/modules/attendance/domain/entities/attendance-alert.entity';
import { AlertType } from '../../../src/modules/attendance/domain/value-objects/alert-type.vo';
import { AttendanceRecordId } from '../../../src/modules/attendance/domain/value-objects/attendance-record-id.vo';
import { JustificationReason } from '../../../src/modules/attendance/domain/value-objects/justification-reason.vo';
import { ScheduleAdapter } from '../../../src/modules/attendance/infrastructure/adapters/schedule.adapter';

describe('attendance domain errors', () => {
	describe('JustificationReason', () => {
		it('rejects an empty reason as invalid input', () => {
			expect(() => new JustificationReason('')).toThrow(DomainError);
			expect(() => new JustificationReason('')).toThrow(
				'El motivo de la justificación es obligatorio',
			);
		});

		it('rejects a reason longer than 500 characters as invalid input', () => {
			const tooLong = 'a'.repeat(501);
			expect(() => new JustificationReason(tooLong)).toThrow(DomainError);
			expect(() => new JustificationReason(tooLong)).toThrow(
				'El motivo de la justificación no puede superar los 500 caracteres',
			);
		});

		it('accepts a reason of exactly 500 characters', () => {
			expect(new JustificationReason('a'.repeat(500)).getRaw()).toHaveLength(500);
		});
	});

	describe('AttendanceRecordId', () => {
		it('rejects an empty id as invalid input', () => {
			expect(() => new AttendanceRecordId('')).toThrow(DomainError);
			expect(() => new AttendanceRecordId('')).toThrow(
				'El identificador del registro de asistencia es obligatorio',
			);
		});
	});

	describe('AttendanceAlert.markAsSeen', () => {
		it('rejects marking an already seen alert as a conflict', () => {
			const alert = AttendanceAlert.create({
				studentId: 'student-1',
				courseId: 'course-1',
				tenantId: 'tenant-1',
				academicYearId: 'year-1',
				absenceCount: 10,
				threshold: 10,
				alertType: AlertType.warning(),
			});
			alert.markAsSeen('user-1');

			expect(() => alert.markAsSeen('user-2')).toThrow(ConflictError);
			expect(() => alert.markAsSeen('user-2')).toThrow(
				'La alerta ya fue marcada como vista',
			);
		});
	});

	describe('ScheduleAdapter.getWorkingDaysOnPeriod', () => {
		it('answers not found when the academic year does not exist', async () => {
			const academicYearRepo = mock<IAcademicYearRepository>();
			academicYearRepo.findById.mockResolvedValue(null);
			const adapter = new ScheduleAdapter(
				mock<IScheduleRepository>(),
				academicYearRepo,
				mock<ScheduleService>(),
			);

			const attempt = adapter.getWorkingDaysOnPeriod(
				new Date('2026-07-01'),
				new Date('2026-07-31'),
				'missing-year',
			);
			await expect(attempt).rejects.toBeInstanceOf(NotFoundError);
			await expect(attempt).rejects.toThrow('Ciclo lectivo no encontrado');
		});
	});
});
