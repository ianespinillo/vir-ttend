import type { ReactNode } from 'react';
import { Button } from '../../ui/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '../../ui/empty';

interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}

export function EmptyState({
	icon,
	title,
	description,
	actionLabel,
	onAction,
}: EmptyStateProps) {
	return (
		<Empty className="my-8 border border-dashed border-border">
			<EmptyHeader>
				{icon && <EmptyMedia variant="icon">{icon}</EmptyMedia>}
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			{onAction && actionLabel && (
				<EmptyContent>
					<Button onClick={onAction}>{actionLabel}</Button>
				</EmptyContent>
			)}
		</Empty>
	);
}
