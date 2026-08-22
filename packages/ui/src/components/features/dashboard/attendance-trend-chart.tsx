'use client';

import type { WeeklyTrendPoint } from '@repo/common';
import { format } from 'date-fns';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '../../../ui/chart';
import { Skeleton } from '../../../ui/skeleton';

export interface AttendanceTrendChartProps {
	trend: WeeklyTrendPoint[];
	isLoading?: boolean;
}

const chartConfig = {
	percent: {
		label: 'Asistencia',
		color: 'hsl(var(--chart-1))',
	},
} satisfies ChartConfig;

export function AttendanceTrendChart({
	trend,
	isLoading,
}: Readonly<AttendanceTrendChartProps>) {
	if (isLoading) {
		return (
			<Card className="shadow-xs border border-border/80">
				<CardHeader>
					<Skeleton className="h-5 w-40" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[200px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!trend || trend.length === 0) return null;

	const data = trend.map((point) => ({
		date: format(new Date(point.mondayWeek), 'dd/MM'),
		percent: point.percent,
	}));

	return (
		<Card className="shadow-xs border border-border/80">
			<CardHeader>
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Tendencia de Asistencia
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[200px] w-full">
					<LineChart data={data}>
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							fontSize={11}
						/>
						<YAxis
							domain={[0, 100]}
							tickLine={false}
							axisLine={false}
							tickMargin={4}
							fontSize={11}
							tickFormatter={(value: number) => `${value}%`}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value) => [`${value}%`, 'Asistencia']}
								/>
							}
						/>
						<Line
							type="monotone"
							dataKey="percent"
							stroke="var(--color-percent)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
