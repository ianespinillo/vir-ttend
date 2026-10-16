import { z } from 'zod';

export const createAcademicYearSchema = z.object({
	year: z.coerce.number().min(2020, 'El año debe ser igual o mayor a 2020'),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'Formato de fecha de inicio esperado: YYYY-MM-DD',
	}),
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'Formato de fecha de fin esperado: YYYY-MM-DD',
	}),
	absenceThresholdPercent: z.coerce
		.number()
		.min(1, 'El umbral debe ser al menos 1%')
		.max(100, 'El umbral no puede superar el 100%'),
	lateCountAbscenseAfterMinutes: z.coerce
		.number()
		.min(0, 'Los minutos no pueden ser negativos'),
	nonWorkingDays: z.array(z.string()).optional(),
	isActive: z.boolean().default(true),
});

export const updateAcademicYearSchema = createAcademicYearSchema.partial();

export const declareNonWorkingDaySchema = z.object({
	date: z
		.string()
		.min(1, 'La fecha es requerida')
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha esperado: YYYY-MM-DD'),
	reason: z
		.string()
		.min(3, 'El motivo debe tener al menos 3 caracteres')
		.max(255, 'El motivo no puede exceder 255 caracteres'),
	type: z.string().optional(),
	notifySchool: z.boolean().default(true),
});

export type CreateAcademicYearFormValues = z.infer<
	typeof createAcademicYearSchema
>;
export type UpdateAcademicYearFormValues = z.infer<
	typeof updateAcademicYearSchema
>;
export type DeclareNonWorkingDayFormValues = z.infer<
	typeof declareNonWorkingDaySchema
>;
