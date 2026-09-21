'use client';

import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '../../ui/button';

export interface ImpersonationBannerProps {
	tenantName?: string;
	onExit?: () => void;
	isExiting?: boolean;
}

export function ImpersonationBanner({
	tenantName,
	onExit,
	isExiting = false,
}: ImpersonationBannerProps) {
	return (
		<aside
			aria-label="Modo impersonación activo"
			className="bg-amber-500 text-amber-950 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-amber-600/30 text-sm font-medium sticky top-0 z-40 shadow-sm"
		>
			<div className="flex items-center gap-2.5">
				<div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-600/20 text-amber-950">
					<ShieldAlert className="h-4 w-4 shrink-0" />
				</div>
				<span>
					<strong className="font-semibold">Modo Impersonación:</strong> Operando
					como <span className="font-bold">Administrador</span> en{' '}
					<span className="font-bold underline decoration-amber-700/60">
						{tenantName || 'la institución'}
					</span>
				</span>
			</div>
			{onExit && (
				<Button
					size="sm"
					variant="outline"
					onClick={onExit}
					disabled={isExiting}
					className="bg-amber-950 text-amber-100 hover:bg-amber-900 hover:text-white border-none text-xs font-semibold h-8 px-3 gap-1.5 shadow-sm transition-colors"
				>
					{isExiting ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<ArrowLeft className="h-3.5 w-3.5" />
					)}
					Volver a Superadmin
				</Button>
			)}
		</aside>
	);
}
