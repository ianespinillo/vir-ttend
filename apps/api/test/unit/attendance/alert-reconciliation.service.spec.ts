import { LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { AlertReconciliationService } from '../../../src/modules/attendance/application/services/alert-reconciliation.service';
import { StudentWeightedAbsencesService } from '../../../src/modules/attendance/application/services/student-weighted-absences.service';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../src/modules/attendance/domain/repositories/attendance-alert.repository.interface';

describe('AlertReconciliationService', () => {
	let service: AlertReconciliationService;
	let coursePort: MockProxy<ICoursePort>;
	let weightedAbsences: MockProxy<StudentWeightedAbsencesService>;
	let alertRepo: MockProxy<IAttendanceAlertRepository>;

	const course = Course.reconstitute(
		'course-1',
		'3ro A',
		'year-1',
		true,
		LEVEL.PRIMARY,
	);
	const withTotals = (totals: Record<string, number>) =>
		weightedAbsences.getStudentWeightedAbsencesForAlert.mockImplementation(
			async (studentId) => ({
				total: totals[studentId],
				cap: 28,
				breakdown: { daily: totals[studentId], workshop: 0 },
			}),
		);

	beforeEach(() => {
		coursePort = mock<ICoursePort>();
		coursePort.findById.mockResolvedValue(course);
		weightedAbsences = mock<StudentWeightedAbsencesService>();
		alertRepo = mock<IAttendanceAlertRepository>();
		service = new AlertReconciliationService(
			coursePort,
			weightedAbsences,
			alertRepo,
		);
	});

	it('asks to delete the alerts above the recomputed total of each student', async () => {
		withTotals({ s1: 4, s2: 12 });

		await service.reconcile('course-1', ['s1', 's2']);

		// The repository removes only alerts with threshold > total, so an alert
		// still reached (threshold <= total) stays.
		expect(alertRepo.deleteAboveThreshold).toHaveBeenCalledWith(
			's1',
			'year-1',
			4,
		);
		expect(alertRepo.deleteAboveThreshold).toHaveBeenCalledWith(
			's2',
			'year-1',
			12,
		);
	});

	it('scopes the delete to the academic year of the course', async () => {
		withTotals({ s1: 0 });

		await service.reconcile('course-1', ['s1']);

		expect(alertRepo.deleteAboveThreshold).toHaveBeenCalledTimes(1);
		expect(alertRepo.deleteAboveThreshold.mock.calls[0][1]).toBe('year-1');
	});

	it('recomputes with the same options as alert generation and no trigger date', async () => {
		withTotals({ s1: 3 });

		await service.reconcile('course-1', ['s1']);

		expect(
			weightedAbsences.getStudentWeightedAbsencesForAlert,
		).toHaveBeenCalledWith('s1', 'year-1', undefined, {
			workshopOnly: course.isWorkshopOnly,
			courseId: 'course-1',
		});
	});

	it('evaluates a repeated student once', async () => {
		withTotals({ s1: 3 });

		await service.reconcile('course-1', ['s1', 's1']);

		expect(
			weightedAbsences.getStudentWeightedAbsencesForAlert,
		).toHaveBeenCalledTimes(1);
		expect(alertRepo.deleteAboveThreshold).toHaveBeenCalledTimes(1);
	});

	it('does nothing when there are no affected students', async () => {
		await service.reconcile('course-1', []);

		expect(coursePort.findById).not.toHaveBeenCalled();
		expect(
			weightedAbsences.getStudentWeightedAbsencesForAlert,
		).not.toHaveBeenCalled();
		expect(alertRepo.deleteAboveThreshold).not.toHaveBeenCalled();
	});

	it('does nothing when the course no longer exists', async () => {
		coursePort.findById.mockResolvedValue(null);

		await service.reconcile('course-1', ['s1']);

		expect(alertRepo.deleteAboveThreshold).not.toHaveBeenCalled();
	});
});
