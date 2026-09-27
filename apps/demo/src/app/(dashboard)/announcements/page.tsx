'use client';

import { useDemo } from '@/lib/session/demo-provider';
import type { CreateAnnouncementFormValues } from '@repo/common';
import { ROLES } from '@repo/common';
import {
	AnnouncementForm,
	AnnouncementsList,
	Button,
	PageHeader,
} from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export default function AnnouncementsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { state, session, selectors, store } = useDemo();

	const user = session.user;
	const role = user?.role;
	const isManager =
		role === ROLES.ADMIN || role === ROLES.PRECEPTOR || role === ROLES.SUPERADMIN;

	const statusParam =
		(searchParams.get('status') as 'draft' | 'published' | null) ?? undefined;
	const page = Number.parseInt(searchParams.get('page') ?? '1', 10);

	const data = selectors.getAnnouncements(state, {
		status: statusParam,
		page,
		limit: 10,
	});

	const readIds = user?.id
		? selectors.getReadAnnouncementIds(state, user.id)
		: new Set<string>();
	const courseNames = selectors.getAnnouncementCourseNames(state);

	// Create form state (inline — no separate route needed for the demo)
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	const courses = selectors.getCourses(state);
	const canTargetSchoolLevel = role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
	const allowedTargetTypes = canTargetSchoolLevel
		? (['school', 'course', 'level'] as const)
		: (['course'] as const);

	const handleCreate = useCallback(
		async (values: CreateAnnouncementFormValues) => {
			if (!user) return;
			setCreateError(null);
			try {
				store.createAnnouncement({
					...values,
					authorName: `${user.firstName} ${user.lastName}`,
				});
				toast.success('Comunicado publicado correctamente');
				setShowCreateForm(false);
			} catch (err: unknown) {
				setCreateError(
					err instanceof Error ? err.message : 'No se pudo crear el comunicado.',
				);
			}
		},
		[store, user],
	);

	const updatePage = useCallback(
		(newPage: number) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('page', String(newPage));
			router.replace(`/announcements?${params.toString()}`);
		},
		[router, searchParams],
	);

	if (showCreateForm && isManager) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Nuevo comunicado"
					description="Redactá el anuncio y elegí la audiencia"
				/>
				{createError && (
					<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
						{createError}
					</div>
				)}
				<AnnouncementForm
					mode="create"
					courses={courses}
					isLoadingCourses={false}
					allowedTargetTypes={[...allowedTargetTypes]}
					isSubmitting={false}
					errorMessage={createError}
					onSubmit={handleCreate}
					onCancel={() => setShowCreateForm(false)}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Comunicados"
				description="Anuncios de la institución"
				actions={
					isManager ? (
						<Button onClick={() => setShowCreateForm(true)}>Nuevo comunicado</Button>
					) : undefined
				}
			/>
			<AnnouncementsList
				data={data}
				isLoading={false}
				readIds={readIds}
				courseNames={courseNames}
				statusVisible={isManager}
				onOpen={(id) => router.push(`/announcements/${id}`)}
				onPageChange={updatePage}
			/>
		</div>
	);
}
