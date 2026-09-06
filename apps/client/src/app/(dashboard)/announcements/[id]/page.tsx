'use client';

import { useAuth } from '@/lib/auth/provider';
import type { Announcement } from '@repo/common';
import {
	useActiveAcademicYear,
	useAnnouncement,
	useCachedForMeAnnouncement,
	useCourses,
	useDeleteAnnouncement,
	useMyCourses,
	usePublishAnnouncement,
	useReadAnnouncements,
} from '@repo/hooks';
import { AnnouncementDetail, LoadingSpinner } from '@repo/ui';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AnnouncementDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { user } = useAuth();

	const id = Array.isArray(params.id) ? params.id[0] : params.id || '';

	const role = user?.role?.toLowerCase();
	const isManager = role === 'admin' || role === 'preceptor';
	const isAdmin = role === 'admin';
	const isAdminSide = role === 'admin' || role === 'superadmin';

	const apiDetail = useAnnouncement(id, { enabled: isManager && Boolean(id) });

	// Detalle híbrido: teachers no tienen GET /announcements/:id (403).
	// Se busca el ítem completo en TODAS las entradas cacheadas de for-me
	// (el fan-out escribe keys sufijadas [...forMe, params]).
	const cached = useCachedForMeAnnouncement(id);

	const announcement = isManager ? (apiDetail.data ?? cached ?? null) : cached;

	const { readIds, markRead } = useReadAnnouncements(user?.id);

	useEffect(() => {
		if (announcement) {
			markRead(announcement.id);
		}
	}, [announcement, markRead]);

	const publishMutation = usePublishAnnouncement();
	const deleteMutation = useDeleteAnnouncement();

	const { data: activeYear } = useActiveAcademicYear();
	const { data: adminCourses } = useCourses({
		academicYearId: isAdminSide ? activeYear?.id : undefined,
	});
	const { data: preceptorCourses } = useMyCourses(
		role === 'preceptor'
			? { academicYearId: activeYear?.id, isPreceptor: true }
			: {},
	);
	const courseList = role === 'preceptor' ? preceptorCourses : adminCourses;
	const courseNames = Object.fromEntries(
		(courseList ?? []).map((c) => [c.id, c.fullName]),
	);

	const isLoading = isManager && Boolean(id) && apiDetail.isLoading && !cached;

	if (!user) {
		return <LoadingSpinner />;
	}

	return (
		<div className="space-y-6">
			<AnnouncementDetail
				announcement={announcement}
				isLoading={isLoading}
				isError={isManager && apiDetail.isError && !cached}
				isBusy={publishMutation.isPending || deleteMutation.isPending}
				canPublish={isManager && announcement?.status === 'draft'}
				canEdit={isManager && announcement?.status === 'draft'}
				canDelete={isAdmin}
				targetLabel={courseNames[announcement?.targetId ?? ''] ?? undefined}
				onBack={() => router.push('/announcements')}
				onPublish={() => publishMutation.mutateAsync(id).catch(() => {})}
				onEdit={() => router.push(`/announcements/${id}/edit`)}
				onDelete={async () => {
					try {
						await deleteMutation.mutateAsync(id);
						router.push('/announcements');
					} catch {
						// queda en detalle si falla
					}
				}}
			/>
		</div>
	);
}
