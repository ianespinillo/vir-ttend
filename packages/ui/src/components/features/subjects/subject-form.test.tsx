import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SubjectForm } from './subject-form';

const courseId = '123e4567-e89b-12d3-a456-426614174000';

describe('SubjectForm', () => {
	it('submits a manual teacher name when no teacher account is selected', async () => {
		const onSubmit = vi.fn();
		render(<SubjectForm courseId={courseId} onSubmit={onSubmit} />);

		fireEvent.change(screen.getByPlaceholderText('Ej. Matemática, Historia'), {
			target: { value: 'Historia' },
		});
		fireEvent.change(screen.getByPlaceholderText('Ej. Ciencias Exactas'), {
			target: { value: 'Sociales' },
		});
		fireEvent.change(screen.getByLabelText('Nombre del docente (sin usuario)'), {
			target: { value: 'Laura Gómez' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Crear Materia' }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Historia', teacherName: 'Laura Gómez' }),
		);
	});

	it('hides the manual teacher name when a teacher account is selected', () => {
		render(
			<SubjectForm
				courseId={courseId}
				onSubmit={vi.fn()}
				defaultValues={{ teacherId: 'teacher-1' }}
				teachers={[
					{
						id: 'teacher-1',
						firstName: 'Ana',
						lastName: 'Pérez',
						email: 'ana@example.com',
					} as never,
				]}
			/>,
		);

		expect(
			screen.queryByLabelText('Nombre del docente (sin usuario)'),
		).not.toBeInTheDocument();
	});
});
