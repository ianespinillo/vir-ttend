'use client';

import type { ExportFormat } from '@repo/common';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../ui/button';

const FORMAT_CONFIG = {
	xlsx: { label: 'Excel', Icon: FileSpreadsheet },
	pdf: { label: 'PDF', Icon: FileText },
} as const;

export interface ExportButtonProps {
	format: ExportFormat;
	onExport: () => unknown;
	isPending?: boolean;
	disabled?: boolean;
}

export function ExportButton({
	format,
	onExport,
	isPending = false,
	disabled = false,
}: ExportButtonProps) {
	const { label, Icon } = FORMAT_CONFIG[format];

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={() => onExport()}
			disabled={disabled || isPending}
		>
			{isPending ? (
				<Loader2 className="animate-spin" />
			) : (
				<Icon className="text-muted-foreground" />
			)}
			<span className={cn(isPending && 'opacity-70')}>{label}</span>
		</Button>
	);
}
