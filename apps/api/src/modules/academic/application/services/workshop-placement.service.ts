import { Inject, Injectable } from '@nestjs/common';
import { COMMISSION_NUMBERS } from '@repo/common';
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
	 * Persists the alphabetical 50/50 split of `students` over the two
	 * commissions (ordered by number). Students already in place are not saved.
	 */
	async applySplit(
		commissions: WorkshopCommission[],
		students: Student[],
	): Promise<void> {
		const [first, second] = [...commissions].sort((a, b) => a.number - b.number);
		const [firstGroup, secondGroup] = WorkshopSplitService.split(students);
		const groups: Array<[WorkshopCommission, Student[]]> = [
			[first, firstGroup],
			[second, secondGroup],
		];
		for (const [commission, group] of groups) {
			for (const student of group) {
				if (student.workshopCommissionId === commission.id) continue;
				student.assignWorkshopCommission(commission.id);
				await this.studentRepo.save(student);
			}
		}
	}

	/**
	 * Assigns a student that just joined a course (not yet saved) to the
	 * commission with fewer active students; ties go to commission 1. Courses
	 * without commissions leave the student unassigned.
	 */
	async placeNewStudent(student: Student): Promise<void> {
		if (!student.courseId) return;
		const commissions = await this.commissionRepo.findByCourse(student.courseId);
		if (commissions.length < COMMISSION_NUMBERS.length) return;
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
