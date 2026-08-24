'use client';

import type { Alert } from '@repo/common';
import { useAlerts, useMarkAlertSeen } from '@repo/hooks';
import { AlertsList, PageHeader } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function AlertsPage() {
	const router = useRouter();
	const [page, setPage] = useState(1);

	const { data: alertsData, isLoading } = useAlerts({ page });
	const markSeenMutation = useMarkAlertSeen();

	const handleMarkSeen = useCallback(
		(alertId: string) => {
			markSeenMutation.mutate(alertId);
		},
		[markSeenMutation],
	);

	const handleAlertClick = useCallback(
		(alert: Alert) => {
			router.push(`/students/${alert.studentId}`);
		},
		[router],
	);

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage);
	}, []);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Alertas"
				description="Alertas de inasistencia y riesgo académico"
			/>

			<AlertsList
				alertsData={alertsData ?? null}
				isLoading={isLoading}
				isMarking={markSeenMutation.isPending}
				onMarkSeen={handleMarkSeen}
				onAlertClick={handleAlertClick}
				onPageChange={handlePageChange}
			/>
		</div>
	);
}
