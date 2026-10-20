import { LEVEL } from './level.enum.js';

/** Year of technical secondary schools that has only workshop subjects. */
export const WORKSHOP_ONLY_YEAR_NUMBER = 7;

export interface WorkshopOnlyCourseInput {
	level?: string | null;
	yearNumber?: number | null;
}

/**
 * Whether a course is workshop-only: the 7th year of a technical secondary
 * school has no theory subjects, so it has no daily attendance and its workshop
 * attendance counts as a single shift. Primary schools also have a 7th grade,
 * hence the level check.
 */
export function isWorkshopOnlyCourse({
	level,
	yearNumber,
}: WorkshopOnlyCourseInput): boolean {
	return level === LEVEL.SECONDARY && yearNumber === WORKSHOP_ONLY_YEAR_NUMBER;
}

/** Message shown when daily attendance is requested for a workshop-only course. */
export const WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE =
	'Los cursos de 7° año técnico no tienen asistencia diaria: se toma solo la de taller.';
