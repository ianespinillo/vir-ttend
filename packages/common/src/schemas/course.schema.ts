import { z } from 'zod';
import { LEVEL } from '../constants/level.enum.js';
import { SHIFT } from '../constants/shift.enum.js';

export const createCourseSchema = z.object({
	academicYearId: z.string().uuid('Debe seleccionar un año lectivo válido'),
	level: z.nativeEnum(LEVEL, {
		errorMap: () => ({ message: 'Seleccione un nivel educativo válido' }),
	}),
	yearNumber: z.coerce
		.number()
		.min(1, 'El número de año/grado debe ser al menos 1'),
	division: z.string().min(1, 'La división es obligatoria'),
	shift: z.nativeEnum(SHIFT, {
		errorMap: () => ({ message: 'Seleccione un turno válido' }),
	}),
	preceptorId: z.string().optional().or(z.literal('')),
});

export const updateCourseSchema = createCourseSchema.partial();

export type CreateCourseFormValues = z.infer<typeof createCourseSchema>;
export type UpdateCourseFormValues = z.infer<typeof updateCourseSchema>;
