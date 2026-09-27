'use client';

import type { IUserWithMembershipResponse } from '@repo/common';
import {
	Check,
	Copy,
	KeyRound,
	Pencil,
	ShieldCheck,
	UserCheck,
	UserX,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Separator } from '../../../ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '../../../ui/sheet';
import { UserStatusBadge } from './user-status-badge';

const ROLE_LABELS: Record<string, string> = {
	admin: 'Admin',
	preceptor: 'Preceptor',
	teacher: 'Docente',
	superadmin: 'Superadmin',
};

const ROLE_BADGE_STYLES: Record<string, string> = {
	superadmin:
		'bg-purple-100 text-purple-950 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800',
	admin:
		'bg-sky-100 text-sky-950 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800',
	preceptor:
		'bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
	teacher:
		'bg-emerald-100 text-emerald-950 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
};

export interface UserManagementSheetProps {
	user: IUserWithMembershipResponse | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onShowCredentials?: (user: IUserWithMembershipResponse) => void;
	onEdit?: (user: IUserWithMembershipResponse) => void;
	onChangeRole?: (user: IUserWithMembershipResponse) => void;
	onToggleStatus?: (
		user: IUserWithMembershipResponse,
		targetStatus: boolean,
	) => void;
	isSuperAdmin?: boolean;
}

export function UserManagementSheet({
	user,
	open,
	onOpenChange,
	onShowCredentials,
	onEdit,
	onChangeRole,
	onToggleStatus,
	isSuperAdmin,
}: Readonly<UserManagementSheetProps>) {
	const [copiedEmail, setCopiedEmail] = useState(false);

	if (!user) return null;

	const initials =
		`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
		'U';
	const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

	const handleCopyEmail = () => {
		navigator.clipboard.writeText(user.email);
		setCopiedEmail(true);
		toast.success('Email copiado al portapapeles');
		setTimeout(() => setCopiedEmail(false), 2000);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-y-auto"
			>
				<SheetHeader className="p-6 pb-4 border-b text-left">
					<SheetTitle className="text-xl font-bold">Panel de Gestión</SheetTitle>
					<SheetDescription className="text-xs text-muted-foreground">
						Administración de accesos y configuración de usuario
					</SheetDescription>
				</SheetHeader>

				<div className="p-6 space-y-6 flex-1">
					{/* Perfil del Usuario */}
					<div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/20">
						<Avatar className="h-13 w-13 shrink-0 border-2 border-background shadow-xs">
							<AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-1.5 min-w-0 flex-1">
							<h3 className="font-bold text-base text-foreground truncate">
								{fullName}
							</h3>
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<span className="truncate">{user.email}</span>
								<button
									type="button"
									onClick={handleCopyEmail}
									title="Copiar email"
									className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
								>
									{copiedEmail ? (
										<Check className="h-3.5 w-3.5 text-emerald-600" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
								</button>
							</div>
							<div className="flex flex-wrap items-center gap-2 pt-1">
								<Badge
									variant="outline"
									className={cn(
										'text-[11px] font-medium border shadow-2xs',
										ROLE_BADGE_STYLES[user.role] ?? 'bg-muted text-foreground',
									)}
								>
									{ROLE_LABELS[user.role] ?? user.role}
								</Badge>
								<UserStatusBadge isActive={user.isActive} />
								{user.tenantName && (
									<Badge variant="outline" className="text-[10px] font-normal">
										{user.tenantName}
									</Badge>
								)}
							</div>
						</div>
					</div>

					<Separator />

					{/* Opciones de gestión */}
					<div className="space-y-3">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Opciones de gestión
						</h4>

						{/* Opción 1: Mostrar / Restablecer credenciales */}
						{onShowCredentials && (
							<div className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-all flex items-start gap-3">
								<div className="p-2 rounded-md bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
									<KeyRound className="h-4 w-4" />
								</div>
								<div className="flex-1 min-w-0 space-y-1">
									<div className="font-semibold text-sm">Mostrar credenciales</div>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Genera y muestra una contraseña temporal provisoria para el primer o
										nuevo ingreso del usuario.
									</p>
									<div className="pt-1.5">
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="h-8 text-xs font-medium gap-1.5"
											onClick={() => onShowCredentials(user)}
										>
											<KeyRound className="h-3.5 w-3.5" />
											Restablecer y ver clave
										</Button>
									</div>
								</div>
							</div>
						)}

						{/* Opción 2: Editar información */}
						{onEdit && (
							<div className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-all flex items-start gap-3">
								<div className="p-2 rounded-md bg-sky-500/10 text-sky-600 shrink-0 mt-0.5">
									<Pencil className="h-4 w-4" />
								</div>
								<div className="flex-1 min-w-0 space-y-1">
									<div className="font-semibold text-sm">Editar información</div>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Actualizar nombre, apellido, datos de contacto o institución asociada.
									</p>
									<div className="pt-1.5">
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="h-8 text-xs font-medium gap-1.5"
											onClick={() => onEdit(user)}
										>
											<Pencil className="h-3.5 w-3.5" />
											Editar datos
										</Button>
									</div>
								</div>
							</div>
						)}

						{/* Opción 3: Cambiar Rol */}
						{onChangeRole && (
							<div className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-all flex items-start gap-3">
								<div className="p-2 rounded-md bg-purple-500/10 text-purple-600 shrink-0 mt-0.5">
									<ShieldCheck className="h-4 w-4" />
								</div>
								<div className="flex-1 min-w-0 space-y-1">
									<div className="font-semibold text-sm">Cambiar rol</div>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Modificar el nivel de acceso asignado (Superadmin, Administrador,
										Preceptor, Docente).
									</p>
									<div className="pt-1.5">
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="h-8 text-xs font-medium gap-1.5"
											onClick={() => onChangeRole(user)}
										>
											<ShieldCheck className="h-3.5 w-3.5" />
											Asignar otro rol
										</Button>
									</div>
								</div>
							</div>
						)}

						{/* Opción 4: Eliminar / Desactivar cuenta */}
						{onToggleStatus && (
							<div
								className={cn(
									'p-3.5 rounded-lg border transition-all flex items-start gap-3',
									user.isActive
										? 'border-destructive/20 bg-destructive/5 hover:bg-destructive/10'
										: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10',
								)}
							>
								<div
									className={cn(
										'p-2 rounded-md shrink-0 mt-0.5',
										user.isActive
											? 'bg-destructive/10 text-destructive'
											: 'bg-emerald-500/10 text-emerald-600',
									)}
								>
									{user.isActive ? (
										<UserX className="h-4 w-4" />
									) : (
										<UserCheck className="h-4 w-4" />
									)}
								</div>
								<div className="flex-1 min-w-0 space-y-1">
									<div className="font-semibold text-sm">
										{user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
									</div>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{user.isActive
											? 'Suspende temporalmente el acceso del usuario al sistema conservando su historial y registros.'
											: 'Restaura el acceso del usuario para que pueda volver a ingresar al sistema.'}
									</p>
									<div className="pt-1.5">
										<Button
											type="button"
											variant={user.isActive ? 'destructive' : 'default'}
											size="sm"
											className="h-8 text-xs font-medium gap-1.5"
											onClick={() => onToggleStatus(user, !user.isActive)}
										>
											{user.isActive ? (
												<>
													<UserX className="h-3.5 w-3.5" />
													Desactivar cuenta
												</>
											) : (
												<>
													<UserCheck className="h-3.5 w-3.5" />
													Activar cuenta
												</>
											)}
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
