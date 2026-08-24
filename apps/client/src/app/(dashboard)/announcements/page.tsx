'use client';

import { useAuth } from '@/lib/auth/provider';
import type { AnnouncementStatus, AnnouncementTargetType } from '@repo/common';
import {
	useActiveAcademicYear,
	useAnnouncements,
	useCourses,
	useReadAnnouncements,
} from '@repo/hooks';
import {
	AnnouncementsList,
	Button,
	ForbiddenState,
	LoadingSpinner,
	PageHeader,
} from '@repo/ui';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const STATUS_OPTIONS = [
	{ value: 'ALL', label: 'Todos los estados' },
	{ value: 'published', label: 'Publicados' },
	{ value: 'draft', label: 'Borradores' },
];

const TARGET_OPTIONS = [
	{ value: 'ALL', label: 'Todas las audiencias' },
	{ value: 'school', label: 'Escuela' },
	{ value: 'course', label: 'Curso' },
	{ value: 'level', label: 'Nivel' },
];

const selectClass =
	'h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function AnnouncementsPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { user } = useAuth();

	const role = user?.role?.toLowerCase();
	const isManager = role === 'admin' || role === 'preceptor';

	const statusParam = searchParams.get('status') || 'ALL';
	const targetTypeParam = searchParams.get('targetType') || 'ALL';
	const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
	const page = Number.isNaN(pageParam) ? 1 : pageParam;

	const { data: activeYear } = useActiveAcademicYear();
	const { data: coursesData } = useCourses({ academicYearId: activeYear?.id });
	const courseNames = Object.fromEntries(
		(coursesData ?? []).map((c) => [c.id, c.fullName]),
	);

	const { data, isLoading } = useAnnouncements({
		status:
			statusParam === 'ALL' ? undefined : (statusParam as AnnouncementStatus),
		targetType:
			targetTypeParam === 'ALL'
				? undefined
				: (targetTypeParam as AnnouncementTargetType),
		page,
		limit: 10,
	});

	const { readIds } = useReadAnnouncements(user?.id);

	const updateQueryParams = useCallback(
		(newParams: Record<string, string | number | undefined>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, val] of Object.entries(newParams)) {
				if (val === undefined || val === '' || val === 'ALL') {
					params.delete(key);
				} else {
					params.set(key, String(val));
				}
			}
			router.push(`${pathname}?${params.toString()}`);
		},
		[pathname, router, searchParams],
	);

	if (!user) {
		return <LoadingSpinner />;
	}

	if (!isManager) {
		return (
			<ForbiddenState
				title="Acceso restringido"
				description="Solo preceptores y administradores pueden gestionar los comunicados. Usá la sección Para mí."
			/>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Comunicados"
				description="Anuncios de la institución"
				actions={
					<Button asChild>
						<Link href="/announcements/create">
							<Plus className="h-4 w-4" />
							Nuevo comunicado
						</Link>
					</Button>
				}
			/>

			<div className="flex flex-wrap items-center gap-3">
				<select
					aria-label="Filtrar por estado"
					className={selectClass}
					value={statusParam}
					onChange={(e) => updateQueryParams({ status: e.target.value, page: 1 })}
				>
					{STATUS_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
				<select
					aria-label="Filtrar por audiencia"
					className={selectClass}
					value={targetTypeParam}
					onChange={(e) =>
						updateQueryParams({ targetType: e.target.value, page: 1 })
					}
				>
					{TARGET_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			</div>

			<AnnouncementsList
				data={data ?? null}
				isLoading={isLoading}
				readIds={readIds}
				courseNames={courseNames}
				statusVisible
				onOpen={(announcementId) => router.push(`/announcements/${announcementId}`)}
				onPageChange={(newPage) => updateQueryParams({ page: newPage })}
			/>
		</div>
	);
}
