import { z } from 'zod';

export const createStudentSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	documentNumber: z.string().min(1),
	birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'Formato esperado: YYYY-MM-DD',
	}),
	courseId: z.string().uuid(),
	tutorName: z.string().min(1),
	tutorPhone: z.string().min(1),
	tutorEmail: z.string().email().optional(),
});

export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;
