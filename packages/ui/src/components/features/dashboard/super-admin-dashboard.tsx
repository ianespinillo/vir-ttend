'use client';

import type { SuperAdminAnalytics, TenantAnalytics } from '@repo/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
	ArrowUpRight,
	Building2,
	CircleCheck,
	CircleX,
	RefreshCw,
	Users,
} from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { cn } from '../../../lib/utils';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '../../../ui/chart';
import { Skeleton } from '../../../ui/skeleton';
import { ErrorState } from '../../shared/error-state';
import { PageHeader } from '../../shared/page-header';

export interface SuperAdminDashboardProps {
	data: SuperAdminAnalytics | null;
	isLoading?: boolean;
	isError?: boolean;
	isRefreshing?: boolean;
	onRefresh?: () => void;
	onRetry?: () => void;
	onManageTenants?: () => void;
	/** @deprecated Use onManageTenants instead */
	onTenantClick?: (tenant: TenantAnalytics) => void;
}

const chartConfig = {
	count: {
		label: 'Instituciones',
		color: 'hsl(var(--chart-1))',
	},
} satisfies ChartConfig;

export function SuperAdminDashboard({
	data,
	isLoading,
	isError,
	isRefreshing,
	onRefresh,
	onRetry,
	onManageTenants,
}: Readonly<SuperAdminDashboardProps>) {
	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Skeleton className="h-7 w-64" />
						<Skeleton className="h-4 w-80" />
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i} className="shadow-xs border border-border/80">
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-14" />
							</CardContent>
						</Card>
					))}
				</div>
				<Card className="shadow-xs border border-border/80">
					<CardHeader>
						<Skeleton className="h-5 w-44" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-[280px] w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isError) {
		return (
			<>
				<PageHeader
					title="Panel de Administración"
					description="Analíticas generales de la plataforma."
				/>
				<ErrorState
					title="No se pudieron cargar las analíticas"
					description="Ocurrió un error al obtener los datos de la plataforma."
					onRetry={onRetry}
				/>
			</>
		);
	}

	if (!data) return null;

	const { totals, tenantsTrend } = data;

	const trendData = tenantsTrend.map((point) => ({
		...point,
		monthLabel: format(new Date(`${point.month}-01T12:00:00`), 'MMM yy', {
			locale: es,
		}),
	}));

	const kpis = [
		{
			label: 'Instituciones',
			value: totals.totalTenants,
			icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
			onClick: onManageTenants,
			isClickable: Boolean(onManageTenants),
		},
		{
			label: 'Activas',
			value: totals.activeTenants,
			icon: <CircleCheck className="h-4 w-4 text-emerald-500" />,
		},
		{
			label: 'Inactivas',
			value: totals.inactiveTenants,
			icon: <CircleX className="h-4 w-4 text-amber-500" />,
		},
		{
			label: 'Usuarios',
			value: totals.totalUsers,
			icon: <Users className="h-4 w-4 text-muted-foreground" />,
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Panel de Administración"
				description="Analíticas generales de la plataforma."
				actions={
					<div className="flex items-center gap-2">
						{onManageTenants && (
							<Button type="button" size="sm" onClick={onManageTenants}>
								<Building2 className="mr-1.5 h-4 w-4" />
								Ver instituciones
							</Button>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onRefresh}
							disabled={isRefreshing}
						>
							<RefreshCw
								className={`mr-1.5 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
							/>
							Actualizar
						</Button>
					</div>
				}
			/>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{kpis.map((kpi) => (
					<Card
						key={kpi.label}
						className={cn(
							'shadow-xs border border-border/80',
							kpi.isClickable &&
								'group cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/30',
						)}
						onClick={kpi.onClick}
					>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle
								className={cn(
									'text-sm font-medium text-muted-foreground flex items-center gap-1.5',
									kpi.isClickable && 'group-hover:text-foreground transition-colors',
								)}
							>
								{kpi.label}
								{kpi.isClickable && (
									<ArrowUpRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
								)}
							</CardTitle>
							{kpi.icon}
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold text-foreground tabular-nums">
								{kpi.value}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			<Card className="shadow-xs border border-border/80">
				<CardHeader>
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Nuevas instituciones por mes
					</CardTitle>
				</CardHeader>
				<CardContent>
					<ChartContainer config={chartConfig} className="h-[280px] w-full">
						<BarChart data={trendData}>
							<XAxis
								dataKey="monthLabel"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								fontSize={11}
							/>
							<YAxis
								allowDecimals={false}
								tickLine={false}
								axisLine={false}
								tickMargin={4}
								fontSize={11}
								tickFormatter={(value: number) => String(value)}
							/>
							<ChartTooltip
								cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
								content={
									<ChartTooltipContent
										formatter={(value) => [`${value} instituciones`, 'Nuevas']}
									/>
								}
							/>
							<Bar
								dataKey="count"
								fill="var(--color-count)"
								radius={[4, 4, 0, 0]}
								maxBarSize={40}
							/>
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>
		</div>
	);
}
