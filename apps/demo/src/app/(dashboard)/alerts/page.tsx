'use client';

import { useDemo } from '@/lib/session/demo-provider';
import type { Alert } from '@repo/common';
import { AlertsList, PageHeader } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function AlertsPage() {
	const router = useRouter();
	const { state, selectors, store } = useDemo();
	const [page, setPage] = useState(1);

	const alertsData = selectors.getAlerts(state, { page, limit: 10 });

	const handleMarkSeen = useCallback(
		(alertId: string) => {
			store.markAlertSeen(alertId);
		},
		[store],
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
				alertsData={alertsData}
				isLoading={false}
				isMarking={false}
				onMarkSeen={handleMarkSeen}
				onAlertClick={handleAlertClick}
				onPageChange={handlePageChange}
			/>
		</div>
	);
}
