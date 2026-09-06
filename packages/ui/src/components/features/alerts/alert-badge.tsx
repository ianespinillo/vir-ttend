'use client';

import { Bell } from 'lucide-react';
import { Button } from '../../../ui/button';

export interface AlertBadgeButtonProps {
	count?: number;
	onClick?: () => void;
}

export function AlertBadgeButton({
	count = 0,
	onClick,
}: Readonly<AlertBadgeButtonProps>) {
	return (
		<Button
			variant="ghost"
			size="icon"
			className="relative h-9 w-9 rounded-full"
			onClick={onClick}
			title="Alertas"
		>
			<Bell className="h-5 w-5 text-muted-foreground" />
			{count > 0 && (
				<span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
					{count > 99 ? '99+' : count}
				</span>
			)}
		</Button>
	);
}
