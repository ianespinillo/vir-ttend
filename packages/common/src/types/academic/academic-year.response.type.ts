import type { ShiftType } from '../../constants/shift.enum.js';

export interface IAcademicYearResponse {
	id: string;
	year: number;
	startDate: Date;
	endDate: Date;
	nonWorkingDays: Date[];
	/** Affected shifts per `YYYY-MM-DD` day; a day without an entry applies to every shift. */
	nonWorkingDayShifts?: Record<string, ShiftType[]>;
	absenceThresholdPercent: number;
	lateCountAbscenseAfterMinutes: number;
	isActive: boolean;
}
