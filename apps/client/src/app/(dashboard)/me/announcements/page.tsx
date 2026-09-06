'use client';

import { useAuth } from '@/lib/auth/provider';
import {
	useActiveAcademicYear,
	useMyCourses,
	useReadAnnouncements,
	useRelevantAnnouncements,
} from '@repo/hooks';
import { ForMeList, LoadingSpinner, PageHeader } from '@repo/ui';
import { useRouter } from 'next/navigation';

export default function ForMeAnnouncementsPage() {
	const router = useRouter();
	const { user } = useAuth();

	const role = user?.role?.toLowerCase();
	const isPreceptor = role === 'preceptor';

	const { data: activeYear } = useActiveAcademicYear();
	const { announcements, isLoading } = useRelevantAnnouncements({
		role: user?.role,
		userId: user?.id,
		academicYearId: activeYear?.id,
	});

	const { readIds, markRead } = useReadAnnouncements(user?.id);

	const { data: myCourses } = useMyCourses(
		isPreceptor ? { academicYearId: activeYear?.id, isPreceptor: true } : {},
	);
	const courseNames = isPreceptor
		? Object.fromEntries((myCourses ?? []).map((c) => [c.id, c.fullName]))
		: undefined;

	if (!user) {
		return <LoadingSpinner />;
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Para mí" description="Comunicados dirigidos a vos" />
			<ForMeList
				announcements={announcements}
				isLoading={isLoading}
				readIds={readIds}
				courseNames={courseNames}
				onOpen={(announcement) => {
					markRead(announcement.id);
					router.push(`/announcements/${announcement.id}`);
				}}
			/>
		</div>
	);
}
