import { Button } from '@/ui/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/ui/empty';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
	message: string;
	onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
	return (
		<Empty className="my-8 border border-dashed border-destructive/30">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<AlertCircle className="text-destructive" />
				</EmptyMedia>
				<EmptyTitle>Algo salio mal</EmptyTitle>
				<EmptyDescription>{message}</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button variant="outline" onClick={onRetry}>
					<RefreshCw />
					Reintentar
				</Button>
			</EmptyContent>
		</Empty>
	);
}
