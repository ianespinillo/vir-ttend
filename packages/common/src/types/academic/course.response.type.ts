import { LevelType } from '../../constants/level.enum.js';
import { ShiftType } from '../../constants/shift.enum.js';
import { IScheduleSlotResponse } from './schedule-slot.response.type.js';
import { ISubjectResponse } from './subject.response.type.js';

export interface ICourseResponse {
	id: string;
	academicYearId?: string;
	level: LevelType;
	yearNumber: number;
	division: string;
	shift: ShiftType;
	preceptorId?: string;
	preceptorName?: string;
	fullName: string;
	studentCount?: number;
	subjectsCount?: number;
}

export interface ICourseDetailResponse extends ICourseResponse {
	subjects?: ISubjectResponse[];
	schedule?: IScheduleSlotResponse[];
}
