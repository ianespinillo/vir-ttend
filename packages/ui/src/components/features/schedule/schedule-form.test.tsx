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

	it('hides the selector and submits null when the course has a single commission', async () => {
		const onSubmit = vi.fn();
		render(
			<ScheduleForm
				subjects={[subject({ kind: SUBJECT_KIND.WORKSHOP })]}
				commissionNumbers={[1]}
				onSubmit={onSubmit}
			/>,
		);
		expect(screen.queryByText('Comisión')).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Agregar Franja' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ commissionNumber: null });
	});

	it('keeps the selector when the course has no commissions yet', () => {
		render(
			<ScheduleForm
				subjects={[subject({ kind: SUBJECT_KIND.WORKSHOP })]}
				commissionNumbers={[]}
				onSubmit={vi.fn()}
			/>,
		);
		expect(screen.getByText('Comisión')).toBeTruthy();
	});

	it('shows the selector when the course has two commissions', () => {
		render(
			<ScheduleForm
				subjects={[subject({ kind: SUBJECT_KIND.WORKSHOP })]}
				commissionNumbers={[1, 2]}
				onSubmit={vi.fn()}
			/>,
		);
		expect(screen.getByText('Comisión')).toBeTruthy();
	});

	it('checks weekly hours only for the commissions the course has', async () => {
		const onSubmit = vi.fn();
		render(
			<ScheduleForm
				subjects={[subject({ kind: SUBJECT_KIND.WORKSHOP, weeklyHours: 4 })]}
				// A stale slot for commission 2 must not count: the course only has commission 1.
				existingSlots={[
					slot({
						dayOfWeek: DAYOFWEEK.TUESDAY,
						startTime: '08:00',
						endTime: '11:00',
						commissionNumber: 2,
					}),
				]}
				commissionNumbers={[1]}
				onSubmit={onSubmit}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Agregar Franja' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
	});

	it('still checks weekly hours per commission when both exist', async () => {
		const onSubmit = vi.fn();
		render(
			<ScheduleForm
				subjects={[subject({ kind: SUBJECT_KIND.WORKSHOP, weeklyHours: 2 })]}
				existingSlots={[
					slot({
						dayOfWeek: DAYOFWEEK.TUESDAY,
						startTime: '08:00',
						endTime: '09:00',
						commissionNumber: 2,
					}),
				]}
				commissionNumbers={[1, 2]}
				onSubmit={onSubmit}
			/>,
		);
		// New slot (08:00-09:20, both) pushes commission 2 to 2h20 > 2h.
		fireEvent.click(screen.getByRole('button', { name: 'Agregar Franja' }));
		await screen.findByText(/supere sus horas semanales/);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
