import { Inject, Injectable } from '@nestjs/common';
import { ScheduleSlot } from '../../domain/entities/schedule-slot.entity';
import { Student } from '../../domain/entities/student.entity';
import {
	Subject,
	TaughtCommissions,
} from '../../domain/entities/subject.entity';
import { ISchedulePort } from '../../domain/ports/schedule.port.interface';
import { IStudentPort } from '../../domain/ports/student.port.interface';
import { IWorkshopCommissionPort } from '../../domain/ports/workshop-commission.port.interface';
import { dayOfWeekOf } from '../../domain/services/day-of-week.util';
import {
	resolveSubjectAudience,
	restrictAudience,
} from '../../domain/services/subject-audience';

/**
 * ACTIVE students who attend a subject on a date. A workshop subject whose
 * slots target one commission only lists that commission's students; anything
 * else (theory subjects, slots for both commissions, a course without
 * commissions) lists the whole active course. A teacher of one commission
 * only gets that commission's students.
 */
@Injectable()
export class SubjectRosterService {
	constructor(
		@Inject('ISchedulePort') private readonly schedulePort: ISchedulePort,
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IStudentPort') private readonly studentPort: IStudentPort,
	) {}

	/**
	 * @param slots the subject's slots, when the caller already loaded them.
	 * @param taught commissions the acting teacher teaches ('all' = unrestricted,
	 * the default for admins and preceptors): the roster is the slot audience
	 * narrowed to them. A course without commissions has nobody to split.
	 */
	async getActiveRoster(
		subject: Subject,
		date: Date,
		slots?: ScheduleSlot[],
		taught: TaughtCommissions = 'all',
	): Promise<Student[]> {
		const subjectSlots =
			slots ?? (await this.schedulePort.findBySubject(subject.id));
		const audience = restrictAudience(
			resolveSubjectAudience(subjectSlots, dayOfWeekOf(date)),
			taught,
		);
		if (audience === 'whole-course') return this.wholeCourse(subject);

		const commissions = await this.commissionPort.findByCourse(subject.courseId);
		if (commissions.length === 0) return this.wholeCourse(subject);
		const commissionIds: string[] = [];
		for (const number of audience) {
			const commission = commissions.find((c) => c.number === number);
			if (!commission) {
				if (taught === 'all') return this.wholeCourse(subject);
				continue;
			}
			commissionIds.push(commission.id);
		}
		const perCommission = await Promise.all(
			commissionIds.map((id) => this.commissionPort.getActiveStudents(id)),
		);
		return perCommission.flat();
	}

	private wholeCourse(subject: Subject): Promise<Student[]> {
		return this.studentPort.getActiveByCourseId(subject.courseId);
	}
}
