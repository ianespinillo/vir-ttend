'use client';

import { useDemo } from '@/lib/session/demo-provider';
import { ForMeList, LoadingSpinner, PageHeader } from '@repo/ui';
import { useRouter } from 'next/navigation';

export default function ForMeAnnouncementsPage() {
	const router = useRouter();
	const { state, session, selectors, store } = useDemo();
	const user = session.user;

	if (!user) {
		return <LoadingSpinner />;
	}

	const announcements = selectors.getAnnouncementsForMe(state, user.id);
	const readIds = selectors.getReadAnnouncementIds(state, user.id);
	const courseNames = selectors.getAnnouncementCourseNames(state);

	const handleOpen = (announcement: { id: string }) => {
		store.markAnnouncementRead(announcement.id, user.id);
		router.push(`/announcements/${announcement.id}`);
	};

	return (
		<div className="space-y-6">
			<PageHeader title="Para mí" description="Comunicados dirigidos a vos" />
			<ForMeList
				announcements={announcements}
				isLoading={false}
				readIds={readIds}
				courseNames={courseNames}
				onOpen={handleOpen}
			/>
		</div>
	);
}
