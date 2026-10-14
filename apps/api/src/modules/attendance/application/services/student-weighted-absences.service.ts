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
		return this.compute(studentId, academicYearId, period, false);
	}

	/**
	 * Total for alert evaluation. Same as the held-based total, except that today
	 * also counts as a contraturno day when the student's commission has a
	 * workshop scheduled today: the daily attendance is usually saved before the
	 * workshop one, and weighing today's absence 1 meanwhile could cross a
	 * threshold and raise a permanent alert. Past days stay held-based.
	 */
	getStudentWeightedAbsencesForAlert(
		studentId: string,
		academicYearId: string,
	): Promise<StudentWeightedAbsences> {
		return this.compute(studentId, academicYearId, undefined, true);
	}

	private async compute(
		studentId: string,
		academicYearId: string,
		period: AbsencePeriod | undefined,
		expectTodayContraturno: boolean,
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
				expectTodayContraturno ? this.expectedContraturnoToday(studentId) : [],
			]);
		const { total, breakdown } = calculateWeightedAbsences({
			dailyRecords,
			workshopRecords,
			expectedContraturnoDays,
		});
		return { total, cap, breakdown };
	}

	/** Today (UTC, as the date keys) when the student's commission has a workshop today. */
	private async expectedContraturnoToday(studentId: string): Promise<string[]> {
		const today = new Date();
		const day = dayOfWeekOf(today);
		if (!day) return [];
		const commission = await this.commissionPort.findByStudent(studentId);
		if (!commission) return [];
		const days = await this.commissionPort.getWorkshopDays(
			commission.courseId,
			commission.number,
		);
		return days.includes(day) ? [toDateKey(today)] : [];
	}

	/**
	 * Absence cap of the student. Today the institutional constant; per-student
	 * extensions (+N with a reason) will add to it here.
	 */
	async getStudentAbsenceCap(_studentId: string): Promise<number> {
		return INSTITUTIONAL_ABSENCE_CAP;
	}
}
