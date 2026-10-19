import type { IWorkshopCommissionResponse } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkshopCommissionsPanel } from './workshop-commissions-panel';

const commission = (
	overrides: Partial<IWorkshopCommissionResponse>,
): IWorkshopCommissionResponse => ({
	id: 'c-1',
	courseId: 'course-1',
	number: 1,
	code: '141',
	preceptorId: null,
	studentCount: 1,
	students: [{ id: 's-1', lastName: 'Alvarez', firstName: 'Ana' }],
	...overrides,
});

const pair = [
	commission({}),
	commission({
		id: 'c-2',
		number: 2,
		code: '142',
		students: [{ id: 's-2', lastName: 'Zapata', firstName: 'Zoe' }],
	}),
];

const handlers = () => ({
	onCreate: vi.fn(),
	onAssignPreceptor: vi.fn(),
	onMoveStudent: vi.fn(),
	onRegenerate: vi.fn(),
});

describe('WorkshopCommissionsPanel', () => {
	it('explains commissions are optional and offers creation when there are none', () => {
		const h = handlers();
		render(<WorkshopCommissionsPanel commissions={[]} {...h} />);

		expect(screen.getByText(/Las comisiones son opcionales/)).toBeTruthy();
		expect(screen.queryByText(/Regenerar reparto/)).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'Crear 2 comisiones' }));
		expect(h.onCreate).toHaveBeenCalledWith(2);
	});

	it('lets the admin create a single commission', () => {
		const h = handlers();
		render(<WorkshopCommissionsPanel commissions={[]} {...h} />);

		fireEvent.click(screen.getByRole('button', { name: 'Crear 1 comisión' }));
		expect(h.onCreate).toHaveBeenCalledWith(1);
	});

	it('shows one card without moves or regeneration when there is a single commission', () => {
		render(
			<WorkshopCommissionsPanel
				commissions={[
					commission({
						studentCount: 2,
						students: [
							{ id: 's-1', lastName: 'Alvarez', firstName: 'Ana' },
							{ id: 's-2', lastName: 'Zapata', firstName: 'Zoe' },
						],
					}),
				]}
				{...handlers()}
			/>,
		);

		expect(screen.getAllByText(/^Comisión 14\d/)).toHaveLength(1);
		expect(screen.getByText(/una sola comisión/)).toBeTruthy();
		expect(
			screen.getByRole('combobox', { name: 'Preceptor de la comisión 141' }),
		).toBeTruthy();
		expect(screen.queryByRole('button', { name: /Mover a/ })).toBeNull();
		expect(
			screen.queryByRole('button', { name: /Regenerar reparto/ }),
		).toBeNull();
	});

	it('shows the derived code of each commission with its students', () => {
		render(<WorkshopCommissionsPanel commissions={pair} {...handlers()} />);

		expect(screen.getByText(/Comisión 141/)).toBeTruthy();
		expect(screen.getByText(/Comisión 142/)).toBeTruthy();
		expect(screen.getByText('Alvarez, Ana')).toBeTruthy();
		expect(screen.getByText('Zapata, Zoe')).toBeTruthy();
		expect(screen.queryByRole('button', { name: /Crear/ })).toBeNull();
	});

	it('orders the commissions by number regardless of response order', () => {
		render(
			<WorkshopCommissionsPanel
				commissions={[
					pair[1] as IWorkshopCommissionResponse,
					pair[0] as IWorkshopCommissionResponse,
				]}
				{...handlers()}
			/>,
		);
		const titles = screen
			.getAllByText(/^Comisión 14\d/)
			.map((e) => e.textContent);
		expect(titles[0]).toContain('141');
		expect(titles[1]).toContain('142');
	});

	it('moves a student to the other commission', () => {
		const h = handlers();
		render(<WorkshopCommissionsPanel commissions={pair} {...h} />);

		fireEvent.click(
			screen.getByRole('button', {
				name: 'Mover a Alvarez, Ana a la comisión 142',
			}),
		);
		expect(h.onMoveStudent).toHaveBeenCalledWith('c-2', 's-1');
	});

	it('asks for confirmation before regenerating', () => {
		const h = handlers();
		render(<WorkshopCommissionsPanel commissions={pair} {...h} />);

		fireEvent.click(screen.getByRole('button', { name: /Regenerar reparto/ }));
		expect(h.onRegenerate).not.toHaveBeenCalled();
		expect(screen.getByText(/historial de asistencia se conserva/)).toBeTruthy();

		fireEvent.click(screen.getByRole('button', { name: 'Sí, regenerar' }));
		expect(h.onRegenerate).toHaveBeenCalledTimes(1);
	});

	it('does not regenerate when the confirmation is cancelled', () => {
		const h = handlers();
		render(<WorkshopCommissionsPanel commissions={pair} {...h} />);

		fireEvent.click(screen.getByRole('button', { name: /Regenerar reparto/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(h.onRegenerate).not.toHaveBeenCalled();
	});

	it('disables the actions while busy', () => {
		render(
			<WorkshopCommissionsPanel commissions={pair} isBusy {...handlers()} />,
		);
		expect(
			(
				screen.getByRole('button', {
					name: /Regenerar reparto/,
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
	});
});
