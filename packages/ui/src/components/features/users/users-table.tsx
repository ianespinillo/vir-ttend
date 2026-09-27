'use client';

import type { IUserWithMembershipResponse } from '@repo/common';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../ui/table';
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

export interface UsersTablePagination {
	page: number;
	totalPages: number;
	total: number;
	limit: number;
	onPageChange: (page: number) => void;
}

export interface UsersTableProps {
	users: IUserWithMembershipResponse[];
	showTenant?: boolean;
	onEdit?: (user: IUserWithMembershipResponse) => void;
	onDeactivate?: (user: IUserWithMembershipResponse) => void;
	onToggleStatus?: (
		user: IUserWithMembershipResponse,
		targetStatus: boolean,
	) => void;
	onChangeRole?: (user: IUserWithMembershipResponse) => void;
	onResetPassword?: (user: IUserWithMembershipResponse) => void;
	onUserClick?: (user: IUserWithMembershipResponse) => void;
	pagination?: UsersTablePagination;
}

export function UsersTable({
	users,
	showTenant,
	onEdit,
	onDeactivate,
	onToggleStatus,
	onChangeRole,
	onResetPassword,
	onUserClick,
	pagination,
}: Readonly<UsersTableProps>) {
	return (
		<div className="space-y-3">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nombre</TableHead>
							<TableHead>Email</TableHead>
							{showTenant && <TableHead>Institución</TableHead>}
							<TableHead>Rol</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead className="text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => (
							<TableRow
								key={user.id}
								className={onUserClick ? 'cursor-pointer hover:bg-muted/50' : undefined}
								onClick={() => onUserClick?.(user)}
							>
								<TableCell className="font-medium">
									{user.firstName} {user.lastName}
								</TableCell>
								<TableCell className="text-muted-foreground">{user.email}</TableCell>
								{showTenant && (
									<TableCell>
										{user.tenantName ? (
											<Badge
												variant={user.tenantName === 'Global' ? 'default' : 'outline'}
												className="font-normal"
											>
												{user.tenantName}
											</Badge>
										) : (
											<span className="text-muted-foreground text-xs">Sin asignar</span>
										)}
									</TableCell>
								)}
								<TableCell>
									<Badge
										variant="outline"
										className={cn(
											'font-medium border shadow-2xs',
											ROLE_BADGE_STYLES[user.role] ?? 'bg-muted text-foreground',
										)}
									>
										{ROLE_LABELS[user.role] ?? user.role}
									</Badge>
								</TableCell>
								<TableCell>
									<UserStatusBadge isActive={user.isActive} />
								</TableCell>
								<TableCell className="text-right">
									{onUserClick ? (
										<Button
											variant="ghost"
											size="sm"
											className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
											onClick={(e) => {
												e.stopPropagation();
												onUserClick(user);
											}}
										>
											<span>Gestionar</span>
											<ChevronRight className="h-4 w-4" />
										</Button>
									) : (
										<div className="flex justify-end gap-2">
											{onChangeRole && (
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														onChangeRole(user);
													}}
												>
													Cambiar Rol
												</Button>
											)}
											{onEdit && (
												<Button
													variant="outline"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														onEdit(user);
													}}
												>
													Editar
												</Button>
											)}
											{onResetPassword && (
												<Button
													variant="ghost"
													size="sm"
													className="text-muted-foreground hover:text-foreground"
													onClick={(e) => {
														e.stopPropagation();
														onResetPassword(user);
													}}
												>
													Restablecer Clave
												</Button>
											)}
											{onToggleStatus &&
												(user.isActive ? (
													<Button
														variant="ghost"
														size="sm"
														className="text-destructive hover:text-destructive hover:bg-destructive/10"
														onClick={(e) => {
															e.stopPropagation();
															onToggleStatus(user, false);
														}}
													>
														Desactivar
													</Button>
												) : (
													<Button
														variant="outline"
														size="sm"
														className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
														onClick={(e) => {
															e.stopPropagation();
															onToggleStatus(user, true);
														}}
													>
														Activar
													</Button>
												))}
											{!onToggleStatus && onDeactivate && user.isActive && (
												<Button
													variant="destructive"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														onDeactivate(user);
													}}
												>
													Desactivar
												</Button>
											)}
										</div>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{pagination && pagination.totalPages > 1 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1">
					<p className="text-xs text-muted-foreground">
						Mostrando{' '}
						{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}{' '}
						- {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
						{pagination.total} usuarios
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => pagination.onPageChange(pagination.page - 1)}
							disabled={pagination.page <= 1}
						>
							Anterior
						</Button>
						<span className="text-xs text-muted-foreground font-medium px-1">
							Pág. {pagination.page} de {pagination.totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => pagination.onPageChange(pagination.page + 1)}
							disabled={pagination.page >= pagination.totalPages}
						>
							Siguiente
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
