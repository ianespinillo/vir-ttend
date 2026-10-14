import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';
import { ISchedulePort } from '../../domain/ports/schedule.port.interface';
import { IWorkshopCommissionPort } from '../../domain/ports/workshop-commission.port.interface';
import { IAttendanceRecordRepository } from '../../domain/repositories/attendance-record.repository.interface';
import { IWorkshopAttendanceRecordRepository } from '../../domain/repositories/workshop-attendance-record.repository.interface';
import {
	INSTITUTIONAL_ABSENCE_CAP,
	WeightedAbsenceBreakdown,
	calculateWeightedAbsences,
} from '../../domain/services/weighted-absence';
import { selectWorkshopDates } from '../../domain/services/workshop-dates';

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
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('ISchedulePort')
		private readonly schedulePort: ISchedulePort,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
	) {}

	/** The period defaults to the whole academic year. */
	async getStudentWeightedAbsences(
		studentId: string,
		academicYearId: string,
		period?: AbsencePeriod,
	): Promise<StudentWeightedAbsences> {
		const academicYear = await this.academicYearPort.findById(academicYearId);
		if (!academicYear) throw new NotFoundException('Academic year not found');
		const { from, to } = period ?? {
			from: academicYear.startDate,
			to: academicYear.endDate,
		};

		const [dailyRecords, workshopRecords, scheduledWorkshopDates, cap] =
			await Promise.all([
				this.attendanceRepository.findDailyByStudentAndDateRange(
					studentId,
					from,
					to,
				),
				this.workshopRepository.findByStudentAndDateRange(studentId, from, to),
				this.getWorkshopDates(studentId, academicYearId, from, to),
				this.getStudentAbsenceCap(studentId),
			]);
		const { total, breakdown } = calculateWeightedAbsences({
			dailyRecords,
			workshopRecords,
			scheduledWorkshopDates,
		});
		return { total, cap, breakdown };
	}

	/**
	 * Absence cap of the student. Today the institutional constant; per-student
	 * extensions (+N with a reason) will add to it here.
	 */
	async getStudentAbsenceCap(_studentId: string): Promise<number> {
		return INSTITUTIONAL_ABSENCE_CAP;
	}

	/**
	 * Working days of the period that are workshop days for the student: the
	 * weekdays the course schedules a workshop for the student's commission. A
	 * student without a commission has none.
	 */
	async getWorkshopDates(
		studentId: string,
		academicYearId: string,
		from: Date,
		to: Date,
	): Promise<Date[]> {
		const commission = await this.commissionPort.findByStudent(studentId);
		if (!commission) return [];
		const [weekdays, workingDays] = await Promise.all([
			this.commissionPort.getWorkshopDays(commission.courseId, commission.number),
			this.schedulePort.getWorkingDaysOnPeriod(from, to, academicYearId),
		]);
		return selectWorkshopDates(workingDays, weekdays);
	}
}
