'use client';

import { useAuth } from '@/lib/auth/provider';
import {
	useActiveAcademicYear,
	useAnnouncement,
	useCourses,
	useUpdateAnnouncement,
} from '@repo/hooks';
import {
	AnnouncementForm,
	ForbiddenState,
	LoadingSpinner,
	PageHeader,
} from '@repo/ui';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EditAnnouncementPage() {
	const params = useParams();
	const router = useRouter();
	const { user } = useAuth();

	const id = Array.isArray(params.id) ? params.id[0] : params.id || '';

	const role = user?.role?.toLowerCase();
	const isManager = role === 'admin' || role === 'preceptor';
	// Solo administradores pueden publicar a toda la escuela o a un nivel.
	const canTargetSchoolLevel = role === 'admin' || role === 'superadmin';
	const allowedTargetTypes = canTargetSchoolLevel
		? (['school', 'course', 'level'] as const)
		: (['course'] as const);

	const { data: announcement, isLoading } = useAnnouncement(id, {
		enabled: isManager && Boolean(id),
	});

	const { data: activeYear } = useActiveAcademicYear();
	const { data: coursesData, isLoading: isLoadingCourses } = useCourses({
		academicYearId: activeYear?.id,
	});

	const updateMutation = useUpdateAnnouncement();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (!user) {
		return <LoadingSpinner />;
	}

	if (!isManager) {
		return (
			<ForbiddenState
				title="Acceso restringido"
				description="Solo preceptores y administradores pueden editar comunicados."
			/>
		);
	}

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (!announcement) {
		return (
			<PageHeader
				title="Editar comunicado"
				description="No se encontró el comunicado a editar."
			/>
		);
	}

	const handleSubmit = async (values: {
		title: string;
		body: string;
		targetType: 'school' | 'course' | 'level';
		targetId?: string;
	}) => {
		setErrorMessage(null);
		try {
			await updateMutation.mutateAsync({
				id,
				data: {
					title: values.title,
					body: values.body,
					targetType: values.targetType,
					targetId: values.targetId || undefined,
				},
			});
			router.push(`/announcements/${id}`);
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			setErrorMessage(
				errorObj?.response?.data?.message ??
					errorObj?.message ??
					'No se pudo guardar el comunicado. Intentá de nuevo.',
			);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Editar comunicado"
				description="Modificá el contenido o la audiencia"
			/>
			<AnnouncementForm
				mode="edit"
				courses={coursesData ?? []}
				isLoadingCourses={isLoadingCourses}
				allowedTargetTypes={[...allowedTargetTypes]}
				defaultValues={{
					title: announcement.title,
					body: announcement.body,
					targetType: announcement.targetType,
					targetId: announcement.targetId || '',
				}}
				isSubmitting={updateMutation.isPending}
				errorMessage={errorMessage}
				onSubmit={handleSubmit}
				onCancel={() => router.push(`/announcements/${id}`)}
			/>
		</div>
	);
}
