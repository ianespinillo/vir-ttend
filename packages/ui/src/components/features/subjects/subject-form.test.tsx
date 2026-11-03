import { SUBJECT_KIND } from '@repo/common';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SubjectForm } from './subject-form';

const courseId = '123e4567-e89b-12d3-a456-426614174000';

describe('SubjectForm', () => {
	// Radix radio items measure themselves; jsdom has no ResizeObserver.
	beforeAll(() => {
		globalThis.ResizeObserver ??= class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	});

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

	describe('workshop teachers per commission', () => {
		const fillBasics = () => {
			fireEvent.change(screen.getByPlaceholderText('Ej. Matemática, Historia'), {
				target: { value: 'Taller' },
			});
			fireEvent.change(screen.getByPlaceholderText('Ej. Ciencias Exactas'), {
				target: { value: 'Técnica' },
			});
		};
		const workshop = { kind: SUBJECT_KIND.WORKSHOP };

		it('offers the per-commission choice only for workshops with both commissions', () => {
			const { unmount } = render(
				<SubjectForm
					courseId={courseId}
					onSubmit={vi.fn()}
					defaultValues={{ kind: SUBJECT_KIND.THEORY }}
					commissionNumbers={[1, 2]}
				/>,
			);
			expect(
				screen.queryByText('Un docente por comisión'),
			).not.toBeInTheDocument();

			unmount();
			render(
				<SubjectForm
					courseId={courseId}
					onSubmit={vi.fn()}
					defaultValues={workshop}
					commissionNumbers={[1]}
				/>,
			);
			expect(
				screen.queryByText('Un docente por comisión'),
			).not.toBeInTheDocument();

			unmount();
			render(
				<SubjectForm
					courseId={courseId}
					onSubmit={vi.fn()}
					defaultValues={workshop}
					commissionNumbers={[1, 2]}
				/>,
			);
			expect(
				screen.getByLabelText('Mismo docente para ambas comisiones'),
			).toBeChecked();
		});

		it('submits one teacher per commission', async () => {
			const onSubmit = vi.fn();
			render(
				<SubjectForm
					courseId={courseId}
					onSubmit={onSubmit}
					defaultValues={workshop}
					commissionNumbers={[1, 2]}
				/>,
			);
			fillBasics();
			fireEvent.click(screen.getByLabelText('Un docente por comisión'));
			fireEvent.change(
				screen.getByLabelText(
					'Docente Comisión 1: nombre del docente (sin usuario)',
				),
				{ target: { value: 'Ana' } },
			);
			fireEvent.change(
				screen.getByLabelText(
					'Docente Comisión 2: nombre del docente (sin usuario)',
				),
				{ target: { value: 'Luis' } },
			);
			fireEvent.click(screen.getByRole('button', { name: 'Crear Materia' }));

			await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					teacherId: '',
					teachers: [
						{ commissionNumber: 1, teacherName: 'Ana' },
						{ commissionNumber: 2, teacherName: 'Luis' },
					],
				}),
			);
		});

		it('prefills a split and replaces it with one whole-subject teacher', async () => {
			const onSubmit = vi.fn();
			render(
				<SubjectForm
					courseId={courseId}
					onSubmit={onSubmit}
					isEditing
					defaultValues={{
						...workshop,
						name: 'Taller',
						area: 'Técnica',
						teachers: [
							{ commissionNumber: 1, teacherName: 'Ana' },
							{ commissionNumber: 2, teacherName: 'Luis' },
						],
					}}
					commissionNumbers={[1, 2]}
				/>,
			);
			expect(
				screen.getByLabelText(
					'Docente Comisión 2: nombre del docente (sin usuario)',
				),
			).toHaveValue('Luis');

			fireEvent.click(
				screen.getByLabelText('Mismo docente para ambas comisiones'),
			);
			fireEvent.change(screen.getByLabelText('Nombre del docente (sin usuario)'), {
				target: { value: 'Marta' },
			});
			fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

			await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					teacherName: 'Marta',
					teachers: [{ commissionNumber: null, teacherName: 'Marta' }],
				}),
			);
		});
	});
});
