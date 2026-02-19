import type { ReactNode } from 'react';

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
}

export function PageHeader({
	title,
	subtitle,
	actions,
}: Readonly<PageHeaderProps>) {
	return (
		<header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-col gap-0.5">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
					{title}
				</h1>
				{subtitle && (
					<p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>
				)}
			</div>
			{actions && (
				<div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
					{actions}
				</div>
			)}
		</header>
	);
}
