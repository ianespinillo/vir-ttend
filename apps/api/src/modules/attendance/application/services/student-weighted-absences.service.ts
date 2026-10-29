import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../common/errors';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../domain/ports/courses.port.interface';
import { IWorkshopCommissionPort } from '../../domain/ports/workshop-commission.port.interface';
import { IAttendanceRecordRepository } from '../../domain/repositories/attendance-record.repository.interface';
import { IWorkshopAttendanceRecordRepository } from '../../domain/repositories/workshop-attendance-record.repository.interface';
import { IWorkshopSessionNotHeldRepository } from '../../domain/repositories/workshop-session-not-held.repository.interface';
import { dayOfWeekOf } from '../../domain/services/day-of-week.util';
import {
	INSTITUTIONAL_ABSENCE_CAP,
	WeightedAbsenceBreakdown,
	WeightedAbsenceOptions,
	calculateWeightedAbsences,
	toDateKey,
} from '../../domain/services/weighted-absence';
import { TheoryNotHeldDaysService } from './theory-not-held-days.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AbsencePeriod {
	from: Date;
	to: Date;
}

export interface StudentAbsenceOptions extends WeightedAbsenceOptions {
	/**
	 * Course of the student. When given, the days its theory was not held (marked
	 * by the preceptor, or an institutional suspension of its shift) make a
	 * workshop absence weigh 1.
	 */
	courseId?: string;
}

export interface AlertAbsenceOptions extends StudentAbsenceOptions {
	/** Reference time bounding how recent the trigger date must be. */
	now?: Date;
}

export interface StudentWeightedAbsences {
	total: number;
	cap: number;
	breakdown: WeightedAbsenceBreakdown;
}

/** Single source of truth for a student's institutional absence count. */
@Injectable()
export class StudentWeightedAbsencesService {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepository: IAttendanceRecordRepository,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly workshopRepository: IWorkshopAttendanceRecordRepository,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		@Inject('IWorkshopSessionNotHeldRepository')
		private readonly workshopNotHeldRepo: IWorkshopSessionNotHeldRepository,
		private readonly theoryNotHeldDays: TheoryNotHeldDaysService,
	) {}

	/**
	 * Purely held-based total (reports): a contraturno day is one with a workshop
	 * record. The period defaults to the whole academic year. `workshopOnly`
	 * flags the student's course as workshop-only (no contraturno halving) and
	 * `courseId` lets the days with no theory class be taken into account.
	 */
	getStudentWeightedAbsences(
		studentId: string,
		academicYearId: string,
		period?: AbsencePeriod,
		options: StudentAbsenceOptions = {},
	): Promise<StudentWeightedAbsences> {
		return this.compute(studentId, academicYearId, period, undefined, options);
	}

	/**
	 * Total for alert evaluation. Same as the held-based total, except that the
	 * date of the record that triggered the evaluation (`YYYY-MM-DD`) also counts
	 * as a contraturno day when the student's commission has a workshop scheduled
	 * that weekday: the daily attendance is usually saved before the workshop one,
	 * and weighing that absence 1 meanwhile could cross a threshold and raise a
	 * permanent alert. Only recent trigger dates qualify (today or yesterday in
	 * UTC, yesterday covering the evening-shift rollover): an edit of an older day
	 * stays held-based, since its workshop either was taken already or never will
	 * be. The day itself comes from the stored record; `now` only bounds how
	 * recent it must be. A workshop-only course has no contraturno, so the
	 * exception never applies there.
	 */
	getStudentWeightedAbsencesForAlert(
		studentId: string,
		academicYearId: string,
		triggerDate?: string,
		{ now = new Date(), workshopOnly, courseId }: AlertAbsenceOptions = {},
	): Promise<StudentWeightedAbsences> {
		const yesterday = toDateKey(new Date(now.getTime() - MS_PER_DAY));
		const recentTrigger =
			!workshopOnly && triggerDate && toDateKey(triggerDate) >= yesterday
				? triggerDate
				: undefined;
		return this.compute(studentId, academicYearId, undefined, recentTrigger, {
			workshopOnly,
			courseId,
		});
	}

	private async compute(
		studentId: string,
		academicYearId: string,
		period: AbsencePeriod | undefined,
		triggerDate: string | undefined,
		{ workshopOnly, courseId }: StudentAbsenceOptions,
	): Promise<StudentWeightedAbsences> {
		const academicYear = await this.academicYearPort.findById(academicYearId);
		if (!academicYear) throw new NotFoundError('Ciclo lectivo no encontrado');
		const { from, to } = period ?? {
			from: academicYear.startDate,
			to: academicYear.endDate,
		};

		const [
			dailyRecords,
			workshopRecords,
			cap,
			expectedContraturnoDays,
			theoryNotHeldDays,
		] = await Promise.all([
			this.attendanceRepository.findDailyByStudentAndDateRange(
				studentId,
				from,
				to,
			),
			this.workshopRepository.findByStudentAndDateRange(studentId, from, to),
			this.getStudentAbsenceCap(studentId),
			triggerDate ? this.expectedContraturnoDay(studentId, triggerDate) : [],
			courseId ? this.courseTheoryNotHeldDays(courseId, from, to) : [],
		]);
		const { total, breakdown } = calculateWeightedAbsences({
			dailyRecords,
			workshopRecords,
			expectedContraturnoDays,
			theoryNotHeldDays,
			workshopOnly,
		});
		return { total, cap, breakdown };
	}

	private async courseTheoryNotHeldDays(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<string[]> {
		const course = await this.coursePort.findById(courseId);
		return course ? this.theoryNotHeldDays.forCourse(course, from, to) : [];
	}

	/**
	 * The trigger date, when the student's commission has a workshop that weekday
	 * and it was not marked as not held (a workshop that will not happen is no
	 * contraturno).
	 */
	private async expectedContraturnoDay(
		studentId: string,
		triggerDate: string,
	): Promise<string[]> {
		const key = toDateKey(triggerDate);
		const day = dayOfWeekOf(new Date(`${key}T00:00:00.000Z`));
		if (!day) return [];
		const commission = await this.commissionPort.findByStudent(studentId);
		if (!commission) return [];
		const notHeld = await this.workshopNotHeldRepo.findByCommissionAndDate(
			commission.id,
			new Date(`${key}T00:00:00.000Z`),
		);
		if (notHeld) return [];
		const days = await this.commissionPort.getWorkshopDays(
			commission.courseId,
			commission.number,
		);
		return days.includes(day) ? [key] : [];
	}

	/**
	 * Absence cap of the student. Today the institutional constant; per-student
	 * extensions (+N with a reason) will add to it here.
	 */
	async getStudentAbsenceCap(_studentId: string): Promise<number> {
		return INSTITUTIONAL_ABSENCE_CAP;
	}
}
