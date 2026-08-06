import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../../ui/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '../../ui/empty';

export interface ForbiddenStateProps {
	title?: string;
	description?: string;
	onBack?: () => void;
	backLabel?: string;
}

export function ForbiddenState({
	title = 'Acceso denegado (403)',
	description = 'No tienes permisos suficientes para acceder a este módulo.',
	onBack,
	backLabel = 'Volver al inicio',
}: ForbiddenStateProps) {
	return (
		<Empty className="my-12 border border-dashed border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/10">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<ShieldAlert className="h-10 w-10 text-amber-500" />
				</EmptyMedia>
				<EmptyTitle className="text-xl font-bold">{title}</EmptyTitle>
				<EmptyDescription className="max-w-md text-muted-foreground">
					{description}
				</EmptyDescription>
			</EmptyHeader>
			{onBack && (
				<EmptyContent>
					<Button variant="outline" onClick={onBack} className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						{backLabel}
					</Button>
				</EmptyContent>
			)}
		</Empty>
	);
}

export const Forbidden = ForbiddenState;
