'use client';

import type { CourseSummaryEntry } from '@repo/common';
import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { buildTrendChartData } from '../../../../lib/report-format';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '../../../../ui/chart';
import { Skeleton } from '../../../../ui/skeleton';

const chartConfig = {
	asistencia: {
		label: 'Asistencia',
		color: 'hsl(var(--primary))',
	},
} satisfies ChartConfig;

export interface AttendanceTrendChartProps {
	months: CourseSummaryEntry[];
	isLoading?: boolean;
}

export function AttendanceTrendChart({
	months,
	isLoading,
}: AttendanceTrendChartProps) {
	const data = buildTrendChartData(months);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<TrendingUp className="h-4 w-4 text-primary" />
					Tendencia del año
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-64 w-full animate-pulse rounded-lg" />
				) : data.length === 0 ? (
					<p className="py-16 text-center text-sm text-muted-foreground">
						Aún no hay suficientes meses generados
					</p>
				) : (
					<ChartContainer config={chartConfig} className="h-64 w-full">
						<AreaChart data={data} margin={{ left: -12, right: 12 }}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="label"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>
							<YAxis
								domain={[0, 100]}
								tickLine={false}
								axisLine={false}
								tickFormatter={(v) => `${v}%`}
							/>
							<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
							<Area
								dataKey="asistencia"
								type="monotone"
								fill="var(--color-asistencia)"
								fillOpacity={0.15}
								stroke="var(--color-asistencia)"
								strokeWidth={2}
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
