'use client';

import { useDemo } from '@/lib/session/demo-provider';
import type { CreateAnnouncementFormValues } from '@repo/common';
import { ROLES } from '@repo/common';
import {
	AnnouncementDetail,
	AnnouncementForm,
	ErrorState,
	PageHeader,
} from '@repo/ui';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AnnouncementDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { state, session, selectors, store } = useDemo();

	const announcementId = Array.isArray(params.id)
		? (params.id[0] ?? '')
		: (params.id ?? '');
	const announcement =
		selectors.getAnnouncementById(state, announcementId) ?? null;

	const user = session.user;
	const role = user?.role;
	const isManager =
		role === ROLES.ADMIN || role === ROLES.PRECEPTOR || role === ROLES.SUPERADMIN;

	// Announcement has authorName but no authorId — allow all managers to edit in the demo
	const canEdit = isManager;
	const canPublish = canEdit && announcement?.status === 'draft';

	const [isEditing, setIsEditing] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	const courses = selectors.getCourses(state);
	const courseNames = selectors.getAnnouncementCourseNames(state);
	const targetLabel =
		announcement?.targetType === 'course' && announcement.targetId
			? courseNames[announcement.targetId]
			: undefined;

	// Mark as read when opened
	if (announcement && user?.id) {
		const readIds = selectors.getReadAnnouncementIds(state, user.id);
		if (!readIds.has(announcementId)) {
			store.markAnnouncementRead(announcementId, user.id);
		}
	}

	const handlePublish = () => {
		try {
			store.publishAnnouncement(announcementId);
		} catch {
			// noop — demo
		}
	};

	const handleEdit = (values: CreateAnnouncementFormValues) => {
		setEditError(null);
		try {
			store.updateAnnouncement(announcementId, values);
			setIsEditing(false);
		} catch (err: unknown) {
			setEditError(
				err instanceof Error ? err.message : 'No se pudo actualizar el comunicado.',
			);
		}
	};

	if (!announcement) {
		return (
			<ErrorState
				title="Comunicado no encontrado"
				description="El comunicado no existe o fue eliminado."
				onRetry={() => router.push('/announcements')}
			/>
		);
	}

	if (isEditing && canEdit) {
		return (
			<div className="space-y-6">
				<PageHeader
					title={`Editar: ${announcement.title}`}
					description="Modificá el contenido o la audiencia del comunicado"
				/>
				<AnnouncementForm
					mode="edit"
					courses={courses}
					isLoadingCourses={false}
					defaultValues={{
						title: announcement.title,
						body: announcement.body,
						targetType: announcement.targetType,
						targetId: announcement.targetId ?? undefined,
					}}
					isSubmitting={false}
					errorMessage={editError}
					onSubmit={handleEdit}
					onCancel={() => setIsEditing(false)}
				/>
			</div>
		);
	}

	return (
		<AnnouncementDetail
			announcement={announcement}
			isLoading={false}
			isError={false}
			isBusy={false}
			canPublish={canPublish}
			canEdit={canEdit}
			canDelete={false}
			targetLabel={targetLabel}
			onBack={() => router.push('/announcements')}
			onPublish={handlePublish}
			onEdit={() => setIsEditing(true)}
		/>
	);
}
