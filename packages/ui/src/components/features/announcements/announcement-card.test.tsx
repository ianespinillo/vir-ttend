import type { Announcement } from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnnouncementCard } from './announcement-card';

const announcement: Announcement = {
	id: 'a1',
	title: 'Reunión de padres',
	body: 'Se convoca a las familias el viernes a las 18 hs en el aula magna.',
	targetType: 'course',
	targetId: 'c1',
	status: 'published',
	publishAt: null,
	authorName: 'María García',
	createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
};

describe('AnnouncementCard', () => {
	it('muestra título, autor y fecha relativa', () => {
		render(<AnnouncementCard announcement={announcement} />);
		expect(screen.getByText('Reunión de padres')).toBeInTheDocument();
		expect(screen.getByText(/María García/)).toBeInTheDocument();
		expect(screen.getByText(/hace 3 horas/)).toBeInTheDocument();
	});

	it('isUnread renderiza el dot; sin unread no existe', () => {
		const { rerender } = render(
			<AnnouncementCard announcement={announcement} isUnread />,
		);
		expect(screen.getByTestId('unread-dot')).toBeInTheDocument();

		rerender(<AnnouncementCard announcement={announcement} />);
		expect(screen.queryByTestId('unread-dot')).not.toBeInTheDocument();
	});

	it('click llama onOpen con el anuncio', () => {
		const onOpen = vi.fn();
		render(<AnnouncementCard announcement={announcement} onOpen={onOpen} />);

		fireEvent.click(screen.getByRole('button'));
		expect(onOpen).toHaveBeenCalledWith(announcement);
	});

	it('statusVisible con draft muestra badge Borrador', () => {
		render(
			<AnnouncementCard
				announcement={{ ...announcement, status: 'draft' }}
				statusVisible
			/>,
		);
		expect(screen.getByText('Borrador')).toBeInTheDocument();
	});
});
