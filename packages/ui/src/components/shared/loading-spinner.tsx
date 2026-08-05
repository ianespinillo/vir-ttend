import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
	className?: string;
	label?: string;
}

export function LoadingSpinner({ className, label }: LoadingSpinnerProps) {
	return (
		<output
			className={cn(
				'flex flex-col items-center justify-center gap-2 py-12',
				className,
			)}
		>
			<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			{label && <span className="text-sm text-muted-foreground">{label}</span>}
			<span className="sr-only">Cargando</span>
		</output>
	);
}
