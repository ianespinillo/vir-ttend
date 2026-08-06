import { z } from 'zod';

export const createSubjectSchema = z.object({
	courseId: z.string().uuid('Debe indicar un curso válido'),
	name: z.string().min(1, 'El nombre de la materia es obligatorio'),
	area: z.string().min(1, 'El área o departamento es obligatorio'),
	weeklyHours: z.coerce
		.number()
		.min(1, 'Las horas semanales deben ser al menos 1'),
	teacherId: z.string().optional().or(z.literal('')),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectFormValues = z.infer<typeof updateSubjectSchema>;
