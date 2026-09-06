'use client';

import type { ExportFormat } from '@repo/common';
import { ExportButton } from '../shared';

export interface ExportActionsProps {
	onExport: (format: ExportFormat) => unknown;
	pendingFormat: ExportFormat | null;
	disabled?: boolean;
}

export function ExportActions({
	onExport,
	pendingFormat,
	disabled,
}: ExportActionsProps) {
	return (
		<div className="flex items-center gap-2">
			<ExportButton
				format="xlsx"
				onExport={() => onExport('xlsx')}
				isPending={pendingFormat === 'xlsx'}
				disabled={disabled || pendingFormat !== null}
			/>
			<ExportButton
				format="pdf"
				onExport={() => onExport('pdf')}
				isPending={pendingFormat === 'pdf'}
				disabled={disabled || pendingFormat !== null}
			/>
		</div>
	);
}
