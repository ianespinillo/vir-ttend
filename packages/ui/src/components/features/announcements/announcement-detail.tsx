'use client';

import type { Announcement } from '@repo/common';
import { ArrowLeft } from 'lucide-react';
import { formatDateTime, formatRelative } from '../../../lib/format';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../../../ui/alert-dialog';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Card, CardContent } from '../../../ui/card';
import { Skeleton } from '../../../ui/skeleton';
import { ErrorState } from '../../shared/error-state';
import { TargetBadge } from './target-badge';

export interface AnnouncementDetailProps {
	announcement: Announcement | null;
	isLoading?: boolean;
	isError?: boolean;
	isBusy?: boolean;
	canPublish?: boolean;
	canEdit?: boolean;
	canDelete?: boolean;
	onBack?: () => void;
	onPublish?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
}

export function AnnouncementDetail({
	announcement,
	isLoading,
	isError,
	isBusy,
	canPublish,
	canEdit,
	canDelete,
	onBack,
	onPublish,
	onEdit,
	onDelete,
}: Readonly<AnnouncementDetailProps>) {
	if (isLoading) {
		return (
			<div data-testid="detail-skeleton" className="space-y-4 max-w-2xl">
				<Skeleton className="h-8 w-32" />
				<Card>
					<CardContent className="space-y-4 pt-6">
						<Skeleton className="h-7 w-2/3" />
						<Skeleton className="h-4 w-48" />
						<div className="space-y-2 pt-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isError || !announcement) {
		return (
			<ErrorState
				title="No se pudo cargar el comunicado"
				description="Puede que haya sido eliminado o que no tengas acceso."
				onRetry={onBack}
			/>
		);
	}

	const isDraft = announcement.status === 'draft';

	return (
		<div className="max-w-2xl space-y-4">
			<Button variant="ghost" size="sm" onClick={onBack} disabled={isBusy}>
				<ArrowLeft className="h-4 w-4" />
				Volver
			</Button>

			<Card>
				<CardContent className="space-y-5 pt-6">
					<div className="space-y-3">
						<h1 className="text-xl font-semibold">{announcement.title}</h1>
						<p className="text-sm text-muted-foreground">
							{announcement.authorName} · {formatDateTime(announcement.createdAt)} (
							{formatRelative(announcement.createdAt)})
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant={isDraft ? 'secondary' : 'default'}>
								{isDraft ? 'Borrador' : 'Publicado'}
							</Badge>
							<TargetBadge targetType={announcement.targetType} />
						</div>
					</div>

					<p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
						{announcement.body}
					</p>

					{(canPublish || canEdit || canDelete) && (
						<div className="flex items-center justify-end gap-2 border-t pt-4">
							{canPublish && isDraft && (
								<Button onClick={onPublish} disabled={isBusy}>
									Publicar ahora
								</Button>
							)}
							{canEdit && (
								<Button variant="outline" onClick={onEdit} disabled={isBusy}>
									Editar
								</Button>
							)}
							{canDelete && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="outline"
											className="text-destructive"
											disabled={isBusy}
										>
											Eliminar
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>¿Eliminar comunicado?</AlertDialogTitle>
											<AlertDialogDescription>
												Esta acción no se puede deshacer. El comunicado se eliminará
												permanentemente.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction onClick={onDelete}>
												Sí, eliminar
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
