'use client';

import { useAuth } from '@/lib/auth/provider';
import { serializePublishAt } from '@repo/common';
import {
	useActiveAcademicYear,
	useCourses,
	useCreateAnnouncement,
} from '@repo/hooks';
import {
	AnnouncementForm,
	ForbiddenState,
	LoadingSpinner,
	PageHeader,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateAnnouncementPage() {
	const router = useRouter();
	const { user } = useAuth();

	const role = user?.role?.toLowerCase();
	const isManager = role === 'admin' || role === 'preceptor';

	const { data: activeYear } = useActiveAcademicYear();
	const { data: coursesData, isLoading: isLoadingCourses } = useCourses({
		academicYearId: activeYear?.id,
	});

	const createMutation = useCreateAnnouncement();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (!user) {
		return <LoadingSpinner />;
	}

	if (!isManager) {
		return (
			<ForbiddenState
				title="Acceso restringido"
				description="Solo preceptores y administradores pueden crear comunicados."
			/>
		);
	}

	const handleSubmit = async (
		values: Parameters<
			NonNullable<React.ComponentProps<typeof AnnouncementForm>['onSubmit']>
		>[0],
	) => {
		setErrorMessage(null);
		try {
			await createMutation.mutateAsync({
				...values,
				publishAt: serializePublishAt(values.publishAt),
			});
			router.push('/announcements');
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			setErrorMessage(
				errorObj?.response?.data?.message ??
					errorObj?.message ??
					'No se pudo crear el comunicado. Intentá de nuevo.',
			);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Nuevo comunicado"
				description="Redactá el anuncio y elegí la audiencia"
			/>
			<AnnouncementForm
				mode="create"
				courses={coursesData ?? []}
				isLoadingCourses={isLoadingCourses}
				isSubmitting={createMutation.isPending}
				errorMessage={errorMessage}
				onSubmit={handleSubmit}
				onCancel={() => router.back()}
			/>
		</div>
	);
}
