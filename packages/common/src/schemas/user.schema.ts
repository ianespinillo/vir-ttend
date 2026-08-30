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
		oldPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
		newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
		confirmNewPassword: z.string().min(8, 'Mínimo 8 caracteres'),
	})
	.refine((d) => d.newPassword === d.confirmNewPassword, {
		message: 'Las contraseñas no coinciden',
		path: ['confirmNewPassword'],
	});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
