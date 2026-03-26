import { z } from 'zod';

export const loginSchema = z.object({
	email: z.email('Email inválido').trim()
		.min(2, "El email debe tener mas de 2 caracteres")
		.max(60, "El email es muy extenso"),
	password: z.string().min(1, 'Contraseña requerida').trim(),
});

export const registerSchema = z
	.object({
		name: z.string().trim()
			.min(2, 'El nombre debe tener al menos 3 caracteres')
			.max(50, "Nombre demasiado extenso")
			.regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras, números y espacios").or(z.literal("")),
		email: z.email('Email inválido').trim().toLowerCase(),
		password: z.string()
			.min(8, 'La contraseña debe tener al menos 8 caracteres')
			.regex(/[A-Z]/, "Debe tener al menos una mayúscula")
			.regex(/[0-9]/, "Debe tener al menos un número")
			.regex(/[^A-Za-z0-9]/, "Debe tener al menos un carácter especial"),
		confirmPassword: z.string().min(8, 'Las contraseñas no coinciden'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Las contraseñas no coinciden',
		path: ['confirmPassword'],
	});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;

