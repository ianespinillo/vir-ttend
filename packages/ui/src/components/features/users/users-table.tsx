'use client';

import type { IUserWithMembershipResponse } from '@repo/common';
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
	onChangeRole?: (user: IUserWithMembershipResponse) => void;
	onUserClick?: (user: IUserWithMembershipResponse) => void;
	pagination?: UsersTablePagination;
}

export function UsersTable({
	users,
	showTenant,
	onEdit,
	onDeactivate,
	onChangeRole,
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
									<Badge variant="secondary">
										{ROLE_LABELS[user.role] ?? user.role}
									</Badge>
								</TableCell>
								<TableCell>
									<UserStatusBadge isActive={user.isActive} />
								</TableCell>
								<TableCell className="text-right">
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
										{onDeactivate && user.isActive && (
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
