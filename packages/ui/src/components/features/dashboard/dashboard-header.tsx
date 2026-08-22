'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../../ui/button';

export interface DashboardHeaderProps {
	preceptorName: string;
	isRefreshing?: boolean;
	onRefresh?: () => void;
}

export function DashboardHeader({
	preceptorName,
	isRefreshing,
	onRefresh,
}: Readonly<DashboardHeaderProps>) {
	const today = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });

	return (
		<div className="flex items-center justify-between">
			<div>
				<h2 className="text-lg font-semibold tracking-tight text-foreground capitalize">
					{today}
				</h2>
				<p className="text-sm text-muted-foreground">Panel de {preceptorName}</p>
			</div>
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
	);
}
