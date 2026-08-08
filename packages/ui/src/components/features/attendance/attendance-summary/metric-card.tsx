'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Card, CardContent } from '../../../../ui/card';

export interface MetricCardProps {
	title: string;
	value: number | string;
	subtitle?: string;
	icon: LucideIcon;
	variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info';
}

export function MetricCard({
	title,
	value,
	subtitle,
	icon: Icon,
	variant = 'default',
}: MetricCardProps) {
	const variantStyles = {
		default: 'border-border/60 bg-card text-foreground',
		success:
			'border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-50',
		destructive:
			'border-rose-500/20 bg-rose-500/5 text-rose-950 dark:text-rose-50',
		warning:
			'border-amber-500/20 bg-amber-500/5 text-amber-950 dark:text-amber-50',
		info:
			'border-indigo-500/20 bg-indigo-500/5 text-indigo-950 dark:text-indigo-50',
	};

	const iconStyles = {
		default: 'text-muted-foreground bg-muted',
		success: 'text-emerald-600 bg-emerald-500/15 dark:text-emerald-400',
		destructive: 'text-rose-600 bg-rose-500/15 dark:text-rose-400',
		warning: 'text-amber-600 bg-amber-500/15 dark:text-amber-400',
		info: 'text-indigo-600 bg-indigo-500/15 dark:text-indigo-400',
	};

	return (
		<Card className={cn('shadow-xs transition-all', variantStyles[variant])}>
			<CardContent className="p-4 flex items-center justify-between">
				<div>
					<p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
						{title}
					</p>
					<div className="flex items-baseline gap-2 mt-1">
						<span className="text-2xl font-extrabold tracking-tight">{value}</span>
						{subtitle && (
							<span className="text-xs font-medium text-muted-foreground">
								{subtitle}
							</span>
						)}
					</div>
				</div>
				<div className={cn('p-2.5 rounded-xl shrink-0', iconStyles[variant])}>
					<Icon className="h-5 w-5" />
				</div>
			</CardContent>
		</Card>
	);
}
