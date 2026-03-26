import { LevelType } from '../../constants/level.enum.js';
import { ShiftType } from '../../constants/shift.enum.js';

export interface ICourseResponse {
	id: string;
	level: LevelType;
	yearNumber: number;
	division: string;
	shift: ShiftType;
	preceptorId: string;
	fullName: string;
}
