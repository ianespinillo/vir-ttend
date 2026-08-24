import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '../../../../ui/tooltip';
import { ExportButton } from './export-button';
import { ReportStatusBadge } from './report-status-badge';

function renderWithTooltip(ui: ReactElement) {
	return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('ReportStatusBadge', () => {
	it('muestra la etiqueta del estado ok con paleta esmeralda', () => {
		renderWithTooltip(<ReportStatusBadge status="ok" absencePercent={12} />);

		expect(screen.getByText('Alto rendimiento').className).toContain('emerald');
	});

	it('muestra En riesgo para at-risk con paleta ámbar', () => {
		renderWithTooltip(<ReportStatusBadge status="at-risk" />);

		expect(screen.getByText('En riesgo').className).toContain('amber');
	});

	it('muestra Umbral excedido para exceeded con paleta rosa', () => {
		renderWithTooltip(<ReportStatusBadge status="exceeded" />);

		expect(screen.getByText('Umbral excedido').className).toContain('rose');
	});
});

describe('ExportButton', () => {
	it('dispara onExport al hacer clic', () => {
		const onExport = vi.fn();

		render(<ExportButton format="xlsx" onExport={onExport} />);

		fireEvent.click(screen.getByRole('button', { name: /excel/i }));
		expect(onExport).toHaveBeenCalledTimes(1);
	});

	it('etiqueta PDF cuando el formato es pdf', () => {
		render(<ExportButton format="pdf" onExport={() => {}} />);

		expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
	});

	it('muestra loader y queda deshabilitado mientras está pendiente', () => {
		render(<ExportButton format="pdf" onExport={() => {}} isPending />);

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		expect(button.querySelector('.animate-spin')).toBeInTheDocument();
	});

	it('respeta el disabled externo', () => {
		render(<ExportButton format="xlsx" onExport={() => {}} disabled />);

		expect(screen.getByRole('button')).toBeDisabled();
	});
});
