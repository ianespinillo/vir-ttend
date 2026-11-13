import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ForgotPasswordForm } from './forgot-password-form';
import { LoginForm } from './login-form';

const setup = (
	overrides: Partial<Parameters<typeof ForgotPasswordForm>[0]> = {},
) => {
	const props = {
		onRequestCode: vi.fn().mockResolvedValue(undefined),
		onResetPassword: vi.fn().mockResolvedValue(undefined),
		onBackToLogin: vi.fn(),
		...overrides,
	};
	render(<ForgotPasswordForm {...props} />);
	return props;
};

const requestCodeFor = async (email: string) => {
	fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
		target: { value: email },
	});
	fireEvent.click(screen.getByRole('button', { name: /enviar código/i }));
	await screen.findByText('Ingresá el código');
};

describe('ForgotPasswordForm', () => {
	it('validates the email before asking for a code', async () => {
		const { onRequestCode } = setup();

		fireEvent.click(screen.getByRole('button', { name: /enviar código/i }));

		expect(
			await screen.findByText(/el correo electrónico no es válido/i),
		).toBeInTheDocument();
		expect(onRequestCode).not.toHaveBeenCalled();
	});

	it('requests a code and moves to the reset step', async () => {
		const { onRequestCode } = setup();

		await requestCodeFor('jane@test.com');

		expect(onRequestCode).toHaveBeenCalledWith({ email: 'jane@test.com' });
		expect(screen.getByLabelText('Código')).toBeInTheDocument();
		expect(screen.getByText('jane@test.com')).toBeInTheDocument();
	});

	it('submits the code with the new password and shows success', async () => {
		const { onResetPassword, onBackToLogin } = setup();
		await requestCodeFor('jane@test.com');

		fireEvent.change(screen.getByLabelText('Código'), {
			target: { value: '042917' },
		});
		fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
			target: { value: 'NuevaClave1!' },
		});
		fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
			target: { value: 'NuevaClave1!' },
		});
		fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

		expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument();
		expect(onResetPassword).toHaveBeenCalledWith({
			email: 'jane@test.com',
			code: '042917',
			newPassword: 'NuevaClave1!',
			confirmNewPassword: 'NuevaClave1!',
		});

		fireEvent.click(screen.getByRole('button', { name: /ir a iniciar sesión/i }));
		expect(onBackToLogin).toHaveBeenCalled();
	});

	it('shows the server message when the code is rejected', async () => {
		setup({
			onResetPassword: vi
				.fn()
				.mockRejectedValue(new Error('El código es inválido o expiró.')),
		});
		await requestCodeFor('jane@test.com');

		fireEvent.change(screen.getByLabelText('Código'), {
			target: { value: '000000' },
		});
		fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
			target: { value: 'NuevaClave1!' },
		});
		fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
			target: { value: 'NuevaClave1!' },
		});
		fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

		expect(
			await screen.findByText('El código es inválido o expiró.'),
		).toBeInTheDocument();
	});

	it('rejects a weak password before calling the API', async () => {
		const { onResetPassword } = setup();
		await requestCodeFor('jane@test.com');

		fireEvent.change(screen.getByLabelText('Código'), {
			target: { value: '042917' },
		});
		fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
			target: { value: 'solominusculas' },
		});
		fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
			target: { value: 'solominusculas' },
		});
		fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

		await waitFor(() =>
			expect(screen.getByText(/debe incluir una mayúscula/i)).toBeInTheDocument(),
		);
		expect(onResetPassword).not.toHaveBeenCalled();
	});
});

describe('LoginForm forgot password link', () => {
	it('is hidden without a handler', () => {
		render(<LoginForm onSubmit={vi.fn()} />);
		expect(
			screen.queryByText('¿Olvidaste tu contraseña?'),
		).not.toBeInTheDocument();
	});

	it('calls the handler when clicked', () => {
		const onForgotPassword = vi.fn();
		render(<LoginForm onSubmit={vi.fn()} onForgotPassword={onForgotPassword} />);
		fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
		expect(onForgotPassword).toHaveBeenCalled();
	});
});
