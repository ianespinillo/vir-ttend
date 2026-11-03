import { LEVEL } from './level.enum.js';
import { SUBJECT_KIND } from './subject-kind.enum.js';

/** Year of technical secondary schools that has only workshop subjects. */
export const WORKSHOP_ONLY_YEAR_NUMBER = 7;

export interface WorkshopOnlyCourseInput {
	level?: string | null;
	yearNumber?: number | null;
}

/**
 * Whether a course is workshop-only: the 7th year of a technical secondary
 * school has no daily attendance and its workshop attendance counts as a single
 * shift. It does have theory subjects, but they are taught in the workshop
 * shift: they keep their theory properties, and their attendance is the
 * workshop attendance, not a per-subject one. Primary schools also have a 7th
 * grade, hence the level check.
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

/** Message shown when per-subject attendance is requested for a theory subject of a workshop-only course. */
export const WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE =
	'Las materias teóricas de 7° año técnico no tienen asistencia por materia: se toma la asistencia de taller.';

export interface SubjectAttendanceInput {
	kind?: string | null;
	course: WorkshopOnlyCourseInput;
}

/**
 * Whether a subject has its own (per-subject) attendance. A theory subject of a
 * workshop-only course is taught in the workshop shift, so its attendance is the
 * workshop one; every other subject keeps its own.
 */
export function hasSubjectAttendance({
	kind,
	course,
}: SubjectAttendanceInput): boolean {
	return !(kind === SUBJECT_KIND.THEORY && isWorkshopOnlyCourse(course));
}
