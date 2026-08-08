'use client';

import { Clock, Info } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../../../ui/tooltip';

export interface LateBadgeProps {
	policyText?: string;
}

export function LateBadge({
	policyText = '2 tardanzas equivalen a 1 inasistencia según la política escolar.',
}: LateBadgeProps) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge
						variant="outline"
						className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 cursor-help"
					>
						<Clock className="h-3 w-3" />
						Tarde
						<Info className="h-3 w-3 ml-0.5 opacity-70" />
					</Badge>
				</TooltipTrigger>
				<TooltipContent className="max-w-xs text-xs">
					<p>{policyText}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
