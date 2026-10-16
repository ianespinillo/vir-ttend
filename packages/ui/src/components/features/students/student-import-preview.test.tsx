import type { IStudentImportPreviewResponse } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StudentImportPreview } from './student-import-preview';

const row = (rowNumber: number, errors: string[]) => ({
	rowNumber,
	errors,
	data: {
		lastName: 'Pérez',
		firstName: `Alumno${rowNumber}`,
		documentNumber: '42123456',
		birthDate: '2010-05-01',
		tutorName: 'María Gómez',
		tutorPhone: '1123456789',
		tutorEmail: null,
	},
});

const build = (errorsByRow: string[][]): IStudentImportPreviewResponse => {
	const rows = errorsByRow.map((errors, i) => row(i + 2, errors));
	const invalidRows = rows.filter((r) => r.errors.length > 0).length;
	return {
		courseId: 'c-1',
		totalRows: rows.length,
		validRows: rows.length - invalidRows,
		invalidRows,
		rows,
	};
};

describe('StudentImportPreview', () => {
	it('disables confirm and shows the errors when a row is invalid', () => {
		const onConfirm = vi.fn();
		render(
			<StudentImportPreview
				preview={build([[], ['DNI duplicado en el archivo']])}
				onConfirm={onConfirm}
				onPickAnotherFile={vi.fn()}
			/>,
		);

		expect(screen.getByText('DNI duplicado en el archivo')).toBeInTheDocument();
		const confirm = screen.getByRole('button', { name: /importar 1 alumnos/i });
		expect(confirm).toBeDisabled();
		fireEvent.click(confirm);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it('lets the user pick another file', () => {
		const onPickAnotherFile = vi.fn();
		render(
			<StudentImportPreview
				preview={build([['Fecha inválida']])}
				onConfirm={vi.fn()}
				onPickAnotherFile={onPickAnotherFile}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: /elegir otro archivo/i }));
		expect(onPickAnotherFile).toHaveBeenCalledOnce();
	});

	it('enables confirm when every row is valid', () => {
		const onConfirm = vi.fn();
		render(
			<StudentImportPreview
				preview={build([[], []])}
				onConfirm={onConfirm}
				onPickAnotherFile={vi.fn()}
			/>,
		);

		const confirm = screen.getByRole('button', { name: /importar 2 alumnos/i });
		expect(confirm).toBeEnabled();
		fireEvent.click(confirm);
		expect(onConfirm).toHaveBeenCalledOnce();
	});
});
