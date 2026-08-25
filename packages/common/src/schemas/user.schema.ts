import { z } from 'zod';

export const createUserSchema = z.object({
	email: z.string().email('Email inválido'),
	firstName: z.string().min(1, 'El nombre es obligatorio'),
	lastName: z.string().min(1, 'El apellido es obligatorio'),
	role: z.string().optional(),
});

export const updateUserSchema = z.object({
	firstName: z.string().min(1, 'El nombre es obligatorio'),
	lastName: z.string().min(1, 'El apellido es obligatorio'),
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
		newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
		confirmPassword: z.string().min(8, 'Mínimo 8 caracteres'),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: 'Las contraseñas no coinciden',
		path: ['confirmPassword'],
	});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
