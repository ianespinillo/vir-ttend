import { z } from 'zod';
import {
	COMMISSION_NUMBERS,
	SUBJECT_KIND,
} from '../constants/subject-kind.enum.js';

/** Teacher of a subject for one workshop commission (null = the whole subject). */
export const subjectTeacherSchema = z.object({
	commissionNumber: z
		.union([z.literal(COMMISSION_NUMBERS[0]), z.literal(COMMISSION_NUMBERS[1])])
		.nullable(),
	teacherId: z.string().optional(),
	/** Teacher without a user account; ignored when teacherId is set. */
	teacherName: z
		.string()
		.max(255, 'El nombre del docente no puede superar los 255 caracteres')
		.optional(),
});

export const createSubjectSchema = z.object({
	courseId: z.string().uuid('Debe indicar un curso válido'),
	name: z.string().min(1, 'El nombre de la materia es obligatorio'),
	area: z.string().min(1, 'El área o departamento es obligatorio'),
	weeklyHours: z.coerce
		.number()
		.min(1, 'Las horas semanales deben ser al menos 1'),
	/** Teacher of the whole subject (null-commission assignment). */
	teacherId: z.string().optional().or(z.literal('')),
	/** Teacher without a user account; ignored when teacherId is set. */
	teacherName: z
		.string()
		.max(255, 'El nombre del docente no puede superar los 255 caracteres')
		.optional(),
	/**
	 * Teacher per workshop commission. When given it wins over teacherId /
	 * teacherName; send one entry per commission, or a single entry with a null
	 * commission for the whole subject.
	 */
	teachers: z.array(subjectTeacherSchema).max(2).optional(),
	kind: z.nativeEnum(SUBJECT_KIND).optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export type SubjectTeacherFormValue = z.infer<typeof subjectTeacherSchema>;
export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectFormValues = z.infer<typeof updateSubjectSchema>;
