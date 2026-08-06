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
