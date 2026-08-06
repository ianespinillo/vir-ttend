import { z } from 'zod';

export const createStudentSchema = z.object({
	firstName: z.string().min(1, 'El nombre es obligatorio'),
	lastName: z.string().min(1, 'El apellido es obligatorio'),
	documentNumber: z.string().min(1, 'El documento es obligatorio'),
	birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'Formato esperado: YYYY-MM-DD',
	}),
	courseId: z.string().uuid('Debe seleccionar un curso válido'),
	tutorName: z.string().min(1, 'El nombre del tutor es obligatorio'),
	tutorPhone: z.string().min(1, 'El teléfono del tutor es obligatorio'),
	tutorEmail: z.string().email('Email inválido').optional().or(z.literal('')),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
	courseId: z.string().uuid('Debe seleccionar un curso válido').optional(),
});

export const enrollSchema = z.object({
	courseId: z.string().uuid('Debe seleccionar un curso válido'),
});

export const transferSchema = z.object({
	targetCourseId: z.string().uuid('Debe seleccionar un curso de destino válido'),
});

export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;
export type UpdateStudentFormValues = z.infer<typeof updateStudentSchema>;
export type EnrollFormValues = z.infer<typeof enrollSchema>;
export type TransferFormValues = z.infer<typeof transferSchema>;
