import { Injectable } from '@nestjs/common';
import { ATTENDANCE_STATUS, DAYOFWEEK } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { ISchedulePort } from '../ports/schedule.port.interface';
import { LatePolicyService } from './late-policy.service';

@Injectable()
export class AttendanceCalculationService {
	constructor(
		private readonly schedulePort: ISchedulePort,
		private readonly latePolicyService: LatePolicyService,
	) {}
	async calculateAbscensePercent(
		records: AttendanceRecord[],
		academicYear: AcademicYear,
		from: Date,
		to: Date,
		subjectId?: string,
	): Promise<number> {
		let expectedClasses = 0;
		if (subjectId) {
			expectedClasses = await this.getExpectedClassesForSubject(
				subjectId,
				from,
				to,
				academicYear.id,
			);
			if (expectedClasses === 0) return 0;
		}
		let total = 0;
		for (const record of records) {
			if (record.status === ATTENDANCE_STATUS.ABSENT) total++;
			else if (record.status === ATTENDANCE_STATUS.LATE) {
				const minutesLate = new Date(
					record.createdAt.getTime() - record.editedAt.getTime(),
				).getMinutes();
				if (
					this.latePolicyService.isLateCountedAsAbsence(
						minutesLate,
						academicYear.lateCountAbscenseAfterMinutes,
					)
				)
					total++;
			}
		}
		return (total / expectedClasses) * 100;
	}
	async getExpectedClassesForSubject(
		subjectId: string,
		from: Date,
		to: Date,
		academicYearId: string,
	): Promise<number> {
		const workingDays = await this.schedulePort.getWorkingDaysOnPeriod(
			from,
			to,
			academicYearId,
		);
		const slots = await this.schedulePort.findBySubject(subjectId);
		const classDaysOfWeek = new Set(slots.map((s) => s.dayOfWeek));
		const expectedClasses = workingDays.filter((d) =>
			classDaysOfWeek.has(this.getDayOfWeek(d)),
		);
		return expectedClasses.length;
	}
	private getDayOfWeek(date: Date): DAYOFWEEK {
		const days: Record<number, DAYOFWEEK> = {
			1: DAYOFWEEK.MONDAY,
			2: DAYOFWEEK.TUESDAY,
			3: DAYOFWEEK.WEDNESDAY,
			4: DAYOFWEEK.THURSDAY,
			5: DAYOFWEEK.FRIDAY,
		};
		return days[date.getDay()];
	}
}
