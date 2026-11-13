import { Inject, Injectable } from '@nestjs/common';
import { ICoursePort } from '../../domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../domain/repositories/attendance-alert.repository.interface';
import { StudentWeightedAbsencesService } from './student-weighted-absences.service';

/**
 * Keeps absence alerts truthful after attendance records are deleted: alerts
 * are only raised when records are registered, so without this the alert of a
 * threshold the student no longer reaches would stay (and its unique index
 * would suppress the real alert later).
 */
@Injectable()
export class AlertReconciliationService {
	constructor(
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		private readonly weightedAbsences: StudentWeightedAbsencesService,
		@Inject('IAttendanceAlertRepository')
		private readonly alertRepo: IAttendanceAlertRepository,
	) {}

	/**
	 * Re-evaluates the students of the course against the academic year of the
	 * course and deletes their alerts of that year whose threshold is above the
	 * new weighted total. Alerts the student still reaches are kept.
	 *
	 * No trigger date is given on purpose: the total is the held-based count of
	 * the whole academic year. The trigger date only adds an expected workshop
	 * day that has no record yet, which can raise a total (a pending absence
	 * counted double) but never lowers it; reconciling with it could keep an
	 * alert the stored records no longer justify.
	 */
	async reconcile(courseId: string, studentIds: string[]): Promise<void> {
		if (studentIds.length === 0) return;
		const course = await this.coursePort.findById(courseId);
		if (!course) return;
		for (const studentId of new Set(studentIds)) {
			const { total } =
				await this.weightedAbsences.getStudentWeightedAbsencesForAlert(
					studentId,
					course.academicYearId,
					undefined,
					{ workshopOnly: course.isWorkshopOnly, courseId },
				);
			await this.alertRepo.deleteAboveThreshold(
				studentId,
				course.academicYearId,
				total,
			);
		}
	}
}
