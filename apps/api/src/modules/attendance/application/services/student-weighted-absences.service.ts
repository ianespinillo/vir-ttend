import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
	 * permanent alert. Other days stay held-based. The date comes from the stored
	 * record, never the clock, so the evening shift cannot shift the day.
	 */
	getStudentWeightedAbsencesForAlert(
		studentId: string,
		academicYearId: string,
		triggerDate?: string,
	): Promise<StudentWeightedAbsences> {
		return this.compute(studentId, academicYearId, undefined, triggerDate);
	}

	private async compute(
		studentId: string,
		academicYearId: string,
		period: AbsencePeriod | undefined,
		triggerDate?: string,
	): Promise<StudentWeightedAbsences> {
		const academicYear = await this.academicYearPort.findById(academicYearId);
		if (!academicYear) throw new NotFoundException('Academic year not found');
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
