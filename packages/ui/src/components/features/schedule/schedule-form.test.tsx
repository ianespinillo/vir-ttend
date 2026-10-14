import {
	DAYOFWEEK,
	type IScheduleSlotResponse,
	type ISubjectResponse,
	SUBJECT_KIND,
} from '@repo/common';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScheduleForm } from './schedule-form';

const subject = (overrides: Partial<ISubjectResponse>): ISubjectResponse =>
	({
		id: 'sub-1',
		name: 'Matemática',
		area: 'Ciencias',
		weeklyHours: 4,
		kind: SUBJECT_KIND.THEORY,
		...overrides,
	}) as ISubjectResponse;

const slot = (
	overrides: Partial<IScheduleSlotResponse>,
): IScheduleSlotResponse =>
	({
		id: 'slot-1',
		subjectId: 'sub-1',
		dayOfWeek: DAYOFWEEK.MONDAY,
		startTime: '08:00',
		endTime: '09:20',
		commissionNumber: null,
		...overrides,
	}) as IScheduleSlotResponse;

describe('ScheduleForm commissions', () => {
	it('hides the commission selector for theory subjects', () => {
		render(<ScheduleForm subjects={[subject({})]} onSubmit={vi.fn()} />);
		expect(screen.queryByText('Comisión')).toBeNull();
	});

	it('shows the commission selector for workshop subjects', () => {
		render(
			<ScheduleForm
				subjects={[subject({ name: 'Carpintería', kind: SUBJECT_KIND.WORKSHOP })]}
				onSubmit={vi.fn()}
			/>,
		);
		expect(screen.getByText('Comisión')).toBeTruthy();
		expect(screen.getAllByText('Ambas').length).toBeGreaterThan(0);
	});

	it('submits a null commission by default', async () => {
		const onSubmit = vi.fn();
		render(
			<ScheduleForm
				subjects={[subject({ kind: SUBJECT_KIND.WORKSHOP })]}
				onSubmit={onSubmit}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Agregar Franja' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ commissionNumber: null });
	});

	it('allows a simultaneous slot only for a different commission', async () => {
		const onSubmit = vi.fn();
		render(
			<ScheduleForm
				subjects={[subject({ kind: SUBJECT_KIND.WORKSHOP })]}
				existingSlots={[slot({ commissionNumber: 1 })]}
				onSubmit={onSubmit}
			/>,
		);
		// Default commission is "Ambas" (null), which shares students with commission 1.
		fireEvent.click(screen.getByRole('button', { name: 'Agregar Franja' }));
		await screen.findByText(/se solapa/);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
