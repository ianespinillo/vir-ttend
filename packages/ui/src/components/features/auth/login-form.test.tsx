import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
	it('renders all form fields', () => {
		render(<LoginForm onSubmit={vi.fn()} />);

		expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
		expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
		expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
	});

	it('shows validation errors when submitting empty form', async () => {
		render(<LoginForm onSubmit={vi.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/el correo electrónico no es válido/i),
			).toBeInTheDocument();
		});
	});

	it('shows validation error for invalid email', async () => {
		render(<LoginForm onSubmit={vi.fn()} />);

		fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
			target: { value: 'not-an-email' },
		});
		fireEvent.change(screen.getByLabelText('Contraseña'), {
			target: { value: 'validpass' },
		});
		fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/el correo electrónico no es válido/i),
			).toBeInTheDocument();
		});
	});

	it('shows validation error for short password', async () => {
		render(<LoginForm onSubmit={vi.fn()} />);

		fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
			target: { value: 'valid@email.com' },
		});
		fireEvent.change(screen.getByLabelText('Contraseña'), {
			target: { value: '12345' },
		});
		fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/la contraseña debe tener al menos 6 caracteres/i),
			).toBeInTheDocument();
		});
	});

	it('calls onSubmit with valid credentials', async () => {
		const onSubmit = vi.fn();
		render(<LoginForm onSubmit={onSubmit} />);

		fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
			target: { value: 'user@school.edu.ar' },
		});
		fireEvent.change(screen.getByLabelText('Contraseña'), {
			target: { value: 'password123' },
		});
		fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(
				{ email: 'user@school.edu.ar', password: 'password123' },
				expect.anything(),
			);
		});
	});

	it('shows error message when errorMessage prop is set', () => {
		render(
			<LoginForm onSubmit={vi.fn()} errorMessage="Credenciales inválidas" />,
		);

		expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
	});

	it('disables inputs and button when isLoading is true', () => {
		render(<LoginForm onSubmit={vi.fn()} isLoading />);

		expect(screen.getByLabelText('Correo Electrónico')).toBeDisabled();
		expect(
			screen.getByRole('button', { name: /iniciando sesión/i }),
		).toBeDisabled();
	});

	it('shows loading text when isLoading', () => {
		render(<LoginForm onSubmit={vi.fn()} isLoading />);

		expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
	});
});
