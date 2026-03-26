import { IAcademicYearResponse } from '@repo/common';
import { AcademicYear } from '../../domain/entities/academic-year.entity';

export class AcademicYearResponseDto implements IAcademicYearResponse {
	id: string;
	year: number;
	startDate: Date;
	endDate: Date;
	absenceThresholdPercent: number;
	lateCountAbscenseAfterMinutes: number;
	isActive: boolean;

	constructor(academicYear: AcademicYear) {
		this.id = academicYear.id.getRaw();
		this.year = academicYear.year;
		this.startDate = academicYear.startDate;
		this.endDate = academicYear.endDate;
		this.absenceThresholdPercent = academicYear.absenceThresholdPercent;
		this.lateCountAbscenseAfterMinutes =
			academicYear.lateCountAbscenseAfterMinutes;
		this.isActive = academicYear.isActive;
	}
}
