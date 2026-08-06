import type { ReactNode } from 'react';

export interface PageHeaderProps {
	title: string;
	subtitle?: string;
	description?: string;
	actions?: ReactNode;
}

export function PageHeader({
	title,
	subtitle,
	description,
	actions,
}: Readonly<PageHeaderProps>) {
	const subText = subtitle ?? description;
	return (
		<header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-col gap-0.5">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
					{title}
				</h1>
				{subText && (
					<p className="text-sm text-muted-foreground text-pretty">{subText}</p>
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
