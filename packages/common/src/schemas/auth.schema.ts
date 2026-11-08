import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().email({ message: 'El correo electrónico no es válido' }),
	password: z
		.string()
		.min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const selectTenantSchema = z.object({
	userId: z.string().min(1, { message: 'ID de usuario requerido' }),
	tenantId: z.string().min(1, { message: 'Debe seleccionar una institución' }),
});

export type SelectTenantFormValues = z.infer<typeof selectTenantSchema>;

/** Same policy the API enforces in its `Password` value object. */
const STRONG_PASSWORD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.email({ message: 'El correo electrónico no es válido' }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
	.object({
		email: z
			.string()
			.trim()
			.email({ message: 'El correo electrónico no es válido' }),
		code: z
			.string()
			.trim()
			.regex(/^\d{6}$/, { message: 'El código tiene 6 dígitos' }),
		newPassword: z
			.string()
			.min(8, { message: 'Mínimo 8 caracteres' })
			.max(20, { message: 'Máximo 20 caracteres' })
			.regex(STRONG_PASSWORD_REGEX, {
				message:
					'Debe incluir una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)',
			}),
		confirmNewPassword: z.string().min(1, 'Repetí la nueva contraseña'),
	})
	.refine((d) => d.newPassword === d.confirmNewPassword, {
		message: 'Las contraseñas no coinciden',
		path: ['confirmNewPassword'],
	});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
