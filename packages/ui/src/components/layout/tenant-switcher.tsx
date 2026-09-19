'use client';

import type { Tenant } from '@repo/common';
import { Building2, Check, ChevronsUpDown, Globe, School } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '../../ui/sidebar';

export interface TenantSwitcherProps {
	tenants?: Tenant[];
	currentTenantId?: string;
	brandName?: string;
	isSuperAdmin?: boolean;
	isImpersonating?: boolean;
	onSelectTenant?: (tenantId: string) => void;
	onExitToGlobal?: () => void;
	onManageTenants?: () => void;
}

export function TenantSwitcher({
	tenants = [],
	currentTenantId,
	brandName = 'Vir-ttend',
	isSuperAdmin = false,
	isImpersonating = false,
	onSelectTenant,
	onExitToGlobal,
	onManageTenants,
}: TenantSwitcherProps) {
	const { isMobile } = useSidebar();
	const canSwitch = Boolean(
		(isSuperAdmin || isImpersonating) && tenants && tenants.length > 0,
	);

	if (!canSwitch) {
		return (
			<div className="flex items-center gap-3 font-semibold text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
				<div className="flex size-8 shrink-0 aspect-square items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
					<School className="h-4 w-4" />
				</div>
				<div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
					<span className="truncate text-base font-bold leading-tight tracking-tight">
						{brandName}
					</span>
					<span className="truncate text-xs text-muted-foreground font-normal">
						Gestión Escolar
					</span>
				</div>
			</div>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="flex size-8 shrink-0 aspect-square items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
								<School className="h-4 w-4" />
							</div>
							<div className="flex flex-col min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
								<span className="truncate text-sm font-semibold">{brandName}</span>
								<span className="truncate text-xs text-muted-foreground">
									{isImpersonating ? 'Modo Institución' : 'Vista Global'}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? 'bottom' : 'right'}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
							Instituciones
						</DropdownMenuLabel>
						{isImpersonating && onExitToGlobal && (
							<>
								<DropdownMenuItem
									onClick={onExitToGlobal}
									className="gap-2 p-2 cursor-pointer font-medium"
								>
									<div className="flex size-6 items-center justify-center rounded-md border bg-background">
										<Globe className="size-4" />
									</div>
									<div className="flex flex-col">
										<span>Vista Global (Superadmin)</span>
										<span className="text-xs text-muted-foreground">
											Salir del modo institución
										</span>
									</div>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
							</>
						)}
						{tenants
							.filter((t) => t.isActive)
							.map((tenant) => {
								const isSelected = tenant.id === currentTenantId;
								return (
									<DropdownMenuItem
										key={tenant.id}
										onClick={() => {
											if (!isSelected) onSelectTenant?.(tenant.id);
										}}
										className="gap-2 p-2 cursor-pointer flex items-center justify-between"
									>
										<div className="flex items-center gap-2 min-w-0 flex-1">
											<div className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-muted/40">
												<Building2 className="size-3.5" />
											</div>
											<div className="flex flex-col min-w-0">
												<span className="truncate text-sm font-medium">{tenant.name}</span>
												<span className="truncate text-xs text-muted-foreground">
													{tenant.subdomain}
												</span>
											</div>
										</div>
										{isSelected && (
											<Check className="size-4 text-primary shrink-0 ml-2" />
										)}
									</DropdownMenuItem>
								);
							})}
						{onManageTenants && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={onManageTenants}
									className="gap-2 p-2 cursor-pointer text-muted-foreground hover:text-foreground text-xs"
								>
									<School className="size-3.5" />
									<span>Administrar instituciones</span>
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
