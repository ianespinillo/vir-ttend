import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../common/errors';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';
import { IWorkshopCommissionPort } from '../../domain/ports/workshop-commission.port.interface';
import { IAttendanceRecordRepository } from '../../domain/repositories/attendance-record.repository.interface';
import { IWorkshopAttendanceRecordRepository } from '../../domain/repositories/workshop-attendance-record.repository.interface';
import { dayOfWeekOf } from '../../domain/services/day-of-week.util';
import {
	INSTITUTIONAL_ABSENCE_CAP,
	WeightedAbsenceBreakdown,
	calculateWeightedAbsences,
	toDateKey,
} from '../../domain/services/weighted-absence';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AbsencePeriod {
	from: Date;
	to: Date;
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
	) {}

	/**
	 * Purely held-based total (reports): a contraturno day is one with a workshop
	 * record. The period defaults to the whole academic year.
	 */
	getStudentWeightedAbsences(
		studentId: string,
		academicYearId: string,
		period?: AbsencePeriod,
	): Promise<StudentWeightedAbsences> {
		return this.compute(studentId, academicYearId, period);
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
	 * recent it must be.
	 */
	getStudentWeightedAbsencesForAlert(
		studentId: string,
		academicYearId: string,
		triggerDate?: string,
		now: Date = new Date(),
	): Promise<StudentWeightedAbsences> {
		const yesterday = toDateKey(new Date(now.getTime() - MS_PER_DAY));
		const recentTrigger =
			triggerDate && toDateKey(triggerDate) >= yesterday ? triggerDate : undefined;
		return this.compute(studentId, academicYearId, undefined, recentTrigger);
	}

	private async compute(
		studentId: string,
		academicYearId: string,
		period: AbsencePeriod | undefined,
		triggerDate?: string,
	): Promise<StudentWeightedAbsences> {
		const academicYear = await this.academicYearPort.findById(academicYearId);
		if (!academicYear) throw new NotFoundError('Ciclo lectivo no encontrado');
		const { from, to } = period ?? {
			from: academicYear.startDate,
			to: academicYear.endDate,
		};

		const [dailyRecords, workshopRecords, cap, expectedContraturnoDays] =
			await Promise.all([
				this.attendanceRepository.findDailyByStudentAndDateRange(
					studentId,
					from,
					to,
				),
				this.workshopRepository.findByStudentAndDateRange(studentId, from, to),
				this.getStudentAbsenceCap(studentId),
				triggerDate ? this.expectedContraturnoDay(studentId, triggerDate) : [],
			]);
		const { total, breakdown } = calculateWeightedAbsences({
			dailyRecords,
			workshopRecords,
			expectedContraturnoDays,
		});
		return { total, cap, breakdown };
	}

	/** The trigger date, when the student's commission has a workshop that weekday. */
	private async expectedContraturnoDay(
		studentId: string,
		triggerDate: string,
	): Promise<string[]> {
		const key = toDateKey(triggerDate);
		const day = dayOfWeekOf(new Date(`${key}T00:00:00.000Z`));
		if (!day) return [];
		const commission = await this.commissionPort.findByStudent(studentId);
		if (!commission) return [];
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
