import type { Announcement } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnnouncementDetail } from './announcement-detail';

const announcement: Announcement = {
	id: 'a1',
	title: 'Cambio de horario',
	body: 'Mañana la entrada es a las 8:30.',
	targetType: 'school',
	targetId: '',
	status: 'draft',
	publishAt: null,
	authorName: 'María García',
	createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

describe('AnnouncementDetail', () => {
	it('muestra título, body y meta', () => {
		render(<AnnouncementDetail announcement={announcement} />);
		expect(screen.getByText('Cambio de horario')).toBeInTheDocument();
		expect(
			screen.getByText('Mañana la entrada es a las 8:30.'),
		).toBeInTheDocument();
		expect(screen.getByText(/María García/)).toBeInTheDocument();
	});

	it('draft + canPublish muestra Publicar ahora y llama onPublish', () => {
		const onPublish = vi.fn();
		render(
			<AnnouncementDetail
				announcement={announcement}
				canPublish
				onPublish={onPublish}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: /Publicar ahora/ }));
		expect(onPublish).toHaveBeenCalledTimes(1);
	});

	it('published no muestra Publicar ni Editar sin permisos', () => {
		render(
			<AnnouncementDetail
				announcement={{ ...announcement, status: 'published' }}
			/>,
		);
		expect(
			screen.queryByRole('button', { name: /Publicar ahora/ }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /Editar/ }),
		).not.toBeInTheDocument();
	});

	it('canDelete confirma con el diálogo antes de eliminar', () => {
		const onDelete = vi.fn();
		render(
			<AnnouncementDetail
				announcement={announcement}
				canDelete
				onDelete={onDelete}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
		expect(onDelete).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: /Sí, eliminar/ }));
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it('loading muestra skeleton', () => {
		render(<AnnouncementDetail announcement={null} isLoading />);
		expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument();
	});
});
