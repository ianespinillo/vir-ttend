'use client';

import type { ITenantOption, Roles } from '@repo/common';
import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';

export interface TenantSelectorProps {
	tenants: ITenantOption[];
	onSelect: (tenantId: string) => void;
	isLoading?: boolean;
	errorMessage?: string | null;
}

const ROLE_LABELS: Record<Roles, string> = {
	superadmin: 'Super Admin',
	admin: 'Administrador',
	preceptor: 'Preceptor',
	teacher: 'Docente',
};

export function TenantSelector({
	tenants,
	onSelect,
	isLoading = false,
	errorMessage,
}: TenantSelectorProps) {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h2 className="text-xl font-bold tracking-tight">
					Seleccionar Institución
				</h2>
				<p className="text-sm text-muted-foreground">
					Tienes acceso a múltiples colegios. Selecciona a cuál deseas ingresar:
				</p>
			</div>

			{errorMessage && (
				<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
					{errorMessage}
				</div>
			)}

			<div className="space-y-2">
				{tenants.map((item) => (
					<Button
						key={item.tenantId}
						variant="outline"
						className="w-full justify-between h-auto py-3 px-4 font-normal hover:border-primary transition-all"
						onClick={() => onSelect(item.tenantId)}
						disabled={isLoading}
					>
						<div className="flex items-center gap-3 text-left">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Building2 className="h-5 w-5" />
							</div>
							<div>
								<p className="font-semibold text-sm leading-snug">{item.tenantName}</p>
								<div className="mt-0.5">
									<Badge
										variant="secondary"
										className="text-[10px] px-1.5 py-0 capitalize"
									>
										{ROLE_LABELS[item.role] || item.role}
									</Badge>
								</div>
							</div>
						</div>
						{isLoading ? (
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						) : (
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						)}
					</Button>
				))}
			</div>
		</div>
	);
}
