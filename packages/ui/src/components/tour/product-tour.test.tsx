import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TourProvider, TourTriggerButton } from './product-tour';
import type { TourStep } from './tour-steps';
import { type TourStorage, hasSeenTour } from './tour-storage';

const STEPS: TourStep[] = [
	{ id: 'welcome', title: 'Bienvenida', body: 'Hola' },
	{
		id: 'nav:/students',
		title: 'Estudiantes',
		body: 'El padrón',
		tips: ['Nuevo Estudiante da de alta un alumno.'],
		route: '/students',
		target: '[data-tour="nav:/students"]',
	},
	{ id: 'finish', title: '¡Listo!', body: 'Fin' },
];

function memoryStorage(seen: string[] = []): TourStorage {
	const data = new Map(seen.map((key) => [`vt.tour.v1.${key}`, 'x']));
	return {
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => {
			data.set(key, value);
		},
	};
}

function Harness({
	storage,
	onNavigate,
	initialPath = '/dashboard',
	enabled = true,
}: {
	storage: TourStorage;
	onNavigate: (href: string) => void;
	initialPath?: string;
	enabled?: boolean;
}) {
	const [path, setPath] = useState(initialPath);
	return (
		<TourProvider
			steps={STEPS}
			storageKey="u-1:admin"
			storage={storage}
			enabled={enabled}
			autoStartDelayMs={0}
			currentPath={path}
			onNavigate={(href) => {
				onNavigate(href);
				setPath(href);
			}}
		>
			<TourTriggerButton />
		</TourProvider>
	);
}

async function flushAutoStart() {
	await act(async () => {
		vi.runOnlyPendingTimers();
	});
}

describe('TourProvider', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts on its own the first time and walks the steps', async () => {
		const onNavigate = vi.fn();
		render(<Harness storage={memoryStorage()} onNavigate={onNavigate} />);
		await flushAutoStart();

		expect(
			screen.getByRole('dialog', { name: 'Bienvenida' }),
		).toBeInTheDocument();
		expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

		fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

		expect(
			screen.getByRole('dialog', { name: 'Estudiantes' }),
		).toBeInTheDocument();
		expect(
			screen.getByText('Nuevo Estudiante da de alta un alumno.'),
		).toBeInTheDocument();
		expect(onNavigate).toHaveBeenCalledWith('/students');

		fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
		expect(
			screen.getByRole('dialog', { name: 'Bienvenida' }),
		).toBeInTheDocument();
	});

	it('finishes on the last step, remembers it and returns to the start page', async () => {
		const storage = memoryStorage();
		const onNavigate = vi.fn();
		render(<Harness storage={storage} onNavigate={onNavigate} />);
		await flushAutoStart();

		fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
		fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
		expect(screen.queryByRole('button', { name: 'Saltar tutorial' })).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

		expect(screen.queryByRole('dialog')).toBeNull();
		expect(hasSeenTour(storage, 'u-1:admin')).toBe(true);
		expect(onNavigate).toHaveBeenLastCalledWith('/dashboard');
	});

	it('can be skipped with the button or Escape', async () => {
		const storage = memoryStorage();
		render(<Harness storage={storage} onNavigate={vi.fn()} />);
		await flushAutoStart();

		fireEvent.click(screen.getByRole('button', { name: 'Saltar tutorial' }));
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(hasSeenTour(storage, 'u-1:admin')).toBe(true);

		fireEvent.click(screen.getByRole('button', { name: 'Ver tutorial' }));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('moves with the arrow keys', async () => {
		render(<Harness storage={memoryStorage()} onNavigate={vi.fn()} />);
		await flushAutoStart();

		fireEvent.keyDown(document, { key: 'ArrowRight' });
		expect(screen.getByText('Paso 2 de 3')).toBeInTheDocument();
		fireEvent.keyDown(document, { key: 'ArrowLeft' });
		expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument();
	});

	it('does not start on its own once seen, but the button replays it', async () => {
		render(
			<Harness storage={memoryStorage(['u-1:admin'])} onNavigate={vi.fn()} />,
		);
		await flushAutoStart();
		expect(screen.queryByRole('dialog')).toBeNull();

		fireEvent.click(screen.getByRole('button', { name: 'Ver tutorial' }));
		expect(
			screen.getByRole('dialog', { name: 'Bienvenida' }),
		).toBeInTheDocument();
	});

	it('stays closed while disabled', async () => {
		render(
			<Harness storage={memoryStorage()} onNavigate={vi.fn()} enabled={false} />,
		);
		await flushAutoStart();
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('supports selecting a specific tutorial from the dropdown menu', async () => {
		const storage = memoryStorage(['u-1:admin']);
		const onNavigate = vi.fn();
		render(
			<TourProvider
				tutorials={[
					{
						id: 'onboarding',
						title: 'Tour general',
						description: 'Recorrido inicial',
						badge: 'General',
						roles: [],
						steps: STEPS,
					},
					{
						id: 'attendance-daily',
						title: 'Toma de asistencia diaria',
						description: 'Guía para tomar lista',
						badge: 'Asistencia',
						roles: [],
						steps: [
							{
								id: 'daily:intro',
								title: 'Registro de Asistencia Diaria',
								body: 'Explicación del registro',
								route: '/attendance/daily',
							},
						],
					},
				]}
				storageKey="u-1:admin"
				storage={storage}
				autoStartDelayMs={0}
				currentPath="/dashboard"
				onNavigate={onNavigate}
			>
				<TourTriggerButton />
			</TourProvider>,
		);
		await flushAutoStart();

		// Trigger opens dropdown menu
		const trigger = screen.getByRole('button', { name: 'Ver tutorial' });
		fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
		fireEvent.keyDown(trigger, { key: 'Enter' });

		expect(screen.getByText('Tutoriales y Guías')).toBeInTheDocument();
		expect(screen.getByText('Toma de asistencia diaria')).toBeInTheDocument();

		// Clicking the tutorial starts it
		fireEvent.click(screen.getByText('Toma de asistencia diaria'));

		expect(
			screen.getByRole('dialog', { name: 'Registro de Asistencia Diaria' }),
		).toBeInTheDocument();
		expect(screen.getByText('Asistencia')).toBeInTheDocument();
		expect(onNavigate).toHaveBeenCalledWith('/attendance/daily');
	});
});

describe('TourTriggerButton', () => {
	it('renders nothing outside a tour', () => {
		const { container } = render(<TourTriggerButton />);
		expect(container).toBeEmptyDOMElement();
	});
});
