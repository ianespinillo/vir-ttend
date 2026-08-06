'use client';

import type { ReactNode } from 'react';
import { SidebarTrigger } from '../../ui/sidebar';

export interface TopbarProps {
	title?: string;
	actions?: ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
	return (
		<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur px-4 transition-all">
			<div className="flex items-center gap-3">
				<SidebarTrigger className="-ml-1" />
				{title && (
					<h1 className="text-lg font-semibold tracking-tight text-foreground">
						{title}
					</h1>
				)}
			</div>
			{actions && <div className="flex items-center gap-3">{actions}</div>}
		</header>
	);
}
