'use client';

import type { Alert, AlertsListResponse } from '@repo/common';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Skeleton } from '../../../ui/skeleton';
import { EmptyState } from '../../shared/empty-state';
import { AlertItem } from './alert-item';

export interface AlertsListProps {
	alertsData: AlertsListResponse | null;
	isLoading?: boolean;
	isMarking?: boolean;
	onMarkSeen?: (alertId: string) => void;
	onAlertClick?: (alert: Alert) => void;
	onPageChange?: (page: number) => void;
}

export function AlertsList({
	alertsData,
	isLoading,
	isMarking,
	onMarkSeen,
	onAlertClick,
	onPageChange,
}: Readonly<AlertsListProps>) {
	if (isLoading) {
		return (
			<div className="border rounded-lg border-border/80">
				{[1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						className="flex items-center gap-4 p-4 border-b border-border/50"
					>
						<Skeleton className="h-8 w-8 rounded-full shrink-0" />
						<Skeleton className="h-4 w-32" />
						<div className="ml-auto flex items-center gap-3">
							<Skeleton className="h-5 w-20 rounded-full" />
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-4 w-20" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (!alertsData || alertsData.items.length === 0) {
		return (
			<div className="border rounded-lg border-border/80">
				<EmptyState
					icon={<AlertTriangle className="h-10 w-10 text-muted-foreground" />}
					title="Sin alertas"
					description="No hay alertas de inasistencia para mostrar."
				/>
			</div>
		);
	}

	return (
		<div className="border rounded-lg border-border/80">
			{alertsData.items.map((alert) => (
				<AlertItem
					key={alert.id}
					alert={alert}
					onMarkSeen={onMarkSeen}
					onClick={onAlertClick}
					isMarking={isMarking}
				/>
			))}

			{alertsData.totalPages > 1 && (
				<div className="flex items-center justify-between p-4">
					<p className="text-sm text-muted-foreground">
						Página {alertsData.page} de {alertsData.totalPages} ({alertsData.total}{' '}
						total)
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onPageChange?.(alertsData.page - 1)}
							disabled={alertsData.page <= 1}
						>
							Anterior
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onPageChange?.(alertsData.page + 1)}
							disabled={alertsData.page >= alertsData.totalPages}
						>
							Siguiente
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
