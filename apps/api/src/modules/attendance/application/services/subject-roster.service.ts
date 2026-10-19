import { Inject, Injectable } from '@nestjs/common';
import { ScheduleSlot } from '../../domain/entities/schedule-slot.entity';
import { Student } from '../../domain/entities/student.entity';
import { Subject } from '../../domain/entities/subject.entity';
import { ISchedulePort } from '../../domain/ports/schedule.port.interface';
import { IStudentPort } from '../../domain/ports/student.port.interface';
import { IWorkshopCommissionPort } from '../../domain/ports/workshop-commission.port.interface';
import { dayOfWeekOf } from '../../domain/services/day-of-week.util';
import { resolveSubjectAudience } from '../../domain/services/subject-audience';

/**
 * ACTIVE students who attend a subject on a date. A workshop subject whose
 * slots target one commission only lists that commission's students; anything
 * else (theory subjects, slots for both commissions, a course without the
 * targeted commissions) lists the whole active course.
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
	 */
	async getActiveRoster(
		subject: Subject,
		date: Date,
		slots?: ScheduleSlot[],
	): Promise<Student[]> {
		const subjectSlots =
			slots ?? (await this.schedulePort.findBySubject(subject.id));
		const audience = resolveSubjectAudience(subjectSlots, dayOfWeekOf(date));
		if (audience === 'whole-course') return this.wholeCourse(subject);

		const commissions = await this.commissionPort.findByCourse(subject.courseId);
		const commissionIds: string[] = [];
		for (const number of audience) {
			const commission = commissions.find((c) => c.number === number);
			if (!commission) return this.wholeCourse(subject);
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
