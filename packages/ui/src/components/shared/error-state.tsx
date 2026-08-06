import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '../../ui/empty';

interface ErrorStateProps {
	title?: string;
	description?: string;
	onRetry?: () => void;
}

export function ErrorState({
	title = 'Algo salio mal',
	description,
	onRetry,
}: ErrorStateProps) {
	return (
		<Empty className="my-8 border border-dashed border-destructive/30">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<AlertCircle className="text-destructive" />
				</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				{onRetry && (
					<Button variant="outline" onClick={onRetry}>
						<RefreshCw />
						Reintentar
					</Button>
				)}
			</EmptyContent>
		</Empty>
	);
}
