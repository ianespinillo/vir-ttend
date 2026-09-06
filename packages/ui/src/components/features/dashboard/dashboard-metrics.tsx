'use client';

import type { DashboardMetrics } from '@repo/common';
import { AlertTriangle, BarChart3, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Skeleton } from '../../../ui/skeleton';

export interface DashboardMetricsProps {
	metrics: DashboardMetrics | null;
	isLoading?: boolean;
}

export function DashboardMetricsSection({
	metrics,
	isLoading,
}: Readonly<DashboardMetricsProps>) {
	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Card key={i} className="shadow-xs border border-border/80">
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!metrics) return null;

	const latestWeek = metrics.weeklyTrend[metrics.weeklyTrend.length - 1];

	return (
		<div className="grid gap-4 md:grid-cols-3">
			<Card className="shadow-xs border border-border/80">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Promedio de Asistencia
					</CardTitle>
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold text-foreground tabular-nums">
						{metrics.averageAttendance.toFixed(1)}%
					</p>
				</CardContent>
			</Card>

			<Card className="shadow-xs border border-border/80">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Cursos en Riesgo
					</CardTitle>
					<AlertTriangle className="h-4 w-4 text-amber-500" />
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold text-foreground tabular-nums">
						{metrics.coursesAtRisk.length}
					</p>
				</CardContent>
			</Card>

			<Card className="shadow-xs border border-border/80">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Tendencia Semanal
					</CardTitle>
					<TrendingDown className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					{latestWeek ? (
						<p className="text-2xl font-bold text-foreground tabular-nums">
							{latestWeek.percent.toFixed(1)}%
						</p>
					) : (
						<p className="text-sm text-muted-foreground">Sin datos</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
