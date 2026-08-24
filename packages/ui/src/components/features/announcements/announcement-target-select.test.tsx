import type { ICourseResponse } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnnouncementTargetSelect } from './announcement-target-select';

const courses = [
	{ id: 'c1', fullName: '5°A' },
	{ id: 'c2', fullName: '6°B' },
] as unknown as ICourseResponse[];

function setup(
	props: Partial<Parameters<typeof AnnouncementTargetSelect>[0]> = {},
) {
	const onTargetTypeChange = vi.fn();
	const onTargetIdChange = vi.fn();
	render(
		<AnnouncementTargetSelect
			targetType="school"
			targetId=""
			courses={courses}
			onTargetTypeChange={onTargetTypeChange}
			onTargetIdChange={onTargetIdChange}
			{...props}
		/>,
	);
	return { onTargetTypeChange, onTargetIdChange };
}

describe('AnnouncementTargetSelect', () => {
	it('renderiza las tres opciones de audiencia', () => {
		setup();
		expect(screen.getByText('Toda la escuela')).toBeInTheDocument();
		expect(screen.getByText('Un curso')).toBeInTheDocument();
		expect(screen.getByText('Un nivel')).toBeInTheDocument();
	});

	it('con targetType course muestra los cursos', () => {
		setup({ targetType: 'course' });
		expect(
			screen.getByRole('option', { name: '5°A' }).getAttribute('value'),
		).toBe('c1');
	});

	it('con targetType level muestra niveles lowercase', () => {
		setup({ targetType: 'level' });
		expect(
			screen.getByRole('option', { name: 'Primaria' }).getAttribute('value'),
		).toBe('primary');
		expect(
			screen.getByRole('option', { name: 'Secundaria' }).getAttribute('value'),
		).toBe('secondary');
	});

	it('cambiar el radio llama onTargetTypeChange', () => {
		const { onTargetTypeChange } = setup();
		fireEvent.click(screen.getByText('Un curso'));
		expect(onTargetTypeChange).toHaveBeenCalledWith('course');
	});
});
