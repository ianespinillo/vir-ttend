'use client';

import type { Alert } from '@repo/common';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '../../../ui/skeleton';
import { EmptyState } from '../../shared/empty-state';
import { AlertItem } from './alert-item';

export interface StudentAlertsSummaryProps {
	alerts: Alert[];
	isLoading?: boolean;
}

export function StudentAlertsSummary({
	alerts,
	isLoading,
}: Readonly<StudentAlertsSummaryProps>) {
	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
						<Skeleton className="h-8 w-8 rounded-full shrink-0" />
						<Skeleton className="h-4 w-32" />
						<div className="ml-auto flex items-center gap-3">
							<Skeleton className="h-5 w-20 rounded-full" />
							<Skeleton className="h-4 w-12" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (!alerts || alerts.length === 0) {
		return (
			<EmptyState
				icon={<AlertTriangle className="h-10 w-10 text-muted-foreground" />}
				title="Sin alertas"
				description="Este estudiante no tiene alertas de inasistencia registradas."
			/>
		);
	}

	return (
		<div className="space-y-3">
			{alerts.map((alert) => (
				<AlertItem key={alert.id} alert={alert} />
			))}
		</div>
	);
}
