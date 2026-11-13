import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, resetPasswordSchema } from './auth.schema.js';

describe('forgotPasswordSchema', () => {
	it('acepta un correo válido y recorta espacios', () => {
		const res = forgotPasswordSchema.safeParse({ email: ' a@b.com ' });
		expect(res.success && res.data.email).toBe('a@b.com');
	});

	it('rechaza un correo inválido', () => {
		expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
	});
});

describe('resetPasswordSchema', () => {
	const valid = {
		email: 'a@b.com',
		code: '042917',
		newPassword: 'NuevaClave1!',
		confirmNewPassword: 'NuevaClave1!',
	};

	it('acepta datos válidos', () => {
		expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
	});

	it('exige un código de 6 dígitos', () => {
		for (const code of ['12345', '1234567', 'abcdef']) {
			const res = resetPasswordSchema.safeParse({ ...valid, code });
			expect(res.success).toBe(false);
		}
	});

	it('exige la misma política de contraseña que la API', () => {
		const res = resetPasswordSchema.safeParse({
			...valid,
			newPassword: 'solominusculas',
			confirmNewPassword: 'solominusculas',
		});
		expect(res.success).toBe(false);
	});

	it('marca la confirmación cuando no coincide', () => {
		const res = resetPasswordSchema.safeParse({
			...valid,
			confirmNewPassword: 'OtraClave1!',
		});
		expect(res.success).toBe(false);
		if (!res.success) {
			expect(res.error.issues[0].path).toEqual(['confirmNewPassword']);
		}
	});
});
