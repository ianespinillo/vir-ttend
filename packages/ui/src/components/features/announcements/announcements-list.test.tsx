import type { Announcement, AnnouncementsListResponse } from '@repo/common';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnnouncementsList } from './announcements-list';

const annc = (id: string): Announcement => ({
	id,
	title: `Anuncio ${id}`,
	body: 'Cuerpo del anuncio.',
	targetType: 'school',
	targetId: '',
	status: 'published',
	publishAt: null,
	authorName: 'Autor',
	createdAt: new Date().toISOString(),
});

const data = (overrides?: Partial<AnnouncementsListResponse>) =>
	({
		items: [annc('a1'), annc('a2')],
		total: 2,
		page: 1,
		limit: 10,
		totalPages: 1,
		...overrides,
	}) satisfies AnnouncementsListResponse;

describe('AnnouncementsList', () => {
	it('isLoading renderiza 5 skeleton rows', () => {
		render(<AnnouncementsList data={null} isLoading />);
		expect(screen.getAllByTestId('skeleton-row')).toHaveLength(5);
	});

	it('data null muestra EmptyState "Sin comunicados"', () => {
		render(<AnnouncementsList data={null} />);
		expect(screen.getByText('Sin comunicados')).toBeInTheDocument();
	});

	it('paginación: página 1 de 2 deja Anterior disabled y Siguiente habilitado', () => {
		const onPageChange = vi.fn();
		render(
			<AnnouncementsList
				data={data({ totalPages: 2, total: 12 })}
				onPageChange={onPageChange}
			/>,
		);

		expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
	});

	it('marca unread según readIds', () => {
		render(<AnnouncementsList data={data()} readIds={new Set(['a2'])} />);
		expect(screen.getAllByTestId('unread-dot')).toHaveLength(1);
	});
});
