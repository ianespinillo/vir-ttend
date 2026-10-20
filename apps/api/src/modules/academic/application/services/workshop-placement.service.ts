import { Inject, Injectable } from '@nestjs/common';
import { Student } from '../../domain/entities/student.entity';
import { WorkshopCommission } from '../../domain/entities/workshop-commission.entity';
import { IStudentRepository } from '../../domain/repositories/student.repository.interface';
import { IWorkshopCommissionRepository } from '../../domain/repositories/workshop-commission.repository.interface';
import { WorkshopSplitService } from '../../domain/services/workshop-split.service';

/** Places students into the workshop commissions of their course. */
@Injectable()
export class WorkshopPlacementService {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
	) {}

	/**
	 * Persists the alphabetical split of `students` over the course's
	 * commissions (ordered by number): 50/50 with two, everyone with one.
	 * Students already in place are not saved.
	 */
	async applySplit(
		commissions: WorkshopCommission[],
		students: Student[],
	): Promise<void> {
		const sorted = [...commissions].sort((a, b) => a.number - b.number);
		if (sorted.length === 0) return;
		const groups = WorkshopSplitService.split(
			students,
			sorted.length === 1 ? 1 : 2,
		);
		for (const [index, commission] of sorted.entries()) {
			for (const student of groups[index] ?? []) {
				if (student.workshopCommissionId === commission.id) continue;
				student.assignWorkshopCommission(commission.id);
				await this.studentRepo.save(student);
			}
		}
	}

	/**
	 * Assigns a student that just joined a course (not yet saved) to the
	 * commission with fewer active students; ties go to commission 1. With a
	 * single commission the student joins it. Courses without commissions leave
	 * the student unassigned.
	 */
	async placeNewStudent(student: Student): Promise<void> {
		if (!student.courseId) return;
		const commissions = await this.commissionRepo.findByCourse(student.courseId);
		if (commissions.length === 0) return;
		if (commissions.length === 1) {
			student.assignWorkshopCommission(commissions[0].id);
			return;
		}
		const [first, second] = [...commissions].sort((a, b) => a.number - b.number);
		const [firstCount, secondCount] = await Promise.all([
			this.studentRepo.countActiveByCommission(first.id),
			this.studentRepo.countActiveByCommission(second.id),
		]);
		student.assignWorkshopCommission(
			secondCount < firstCount ? second.id : first.id,
		);
	}
}
