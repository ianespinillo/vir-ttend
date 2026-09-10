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

export interface UsersTableProps {
	users: IUserWithMembershipResponse[];
	onEdit?: (user: IUserWithMembershipResponse) => void;
	onDeactivate?: (user: IUserWithMembershipResponse) => void;
	onChangeRole?: (user: IUserWithMembershipResponse) => void;
}

export function UsersTable({
	users,
	onEdit,
	onDeactivate,
	onChangeRole,
}: Readonly<UsersTableProps>) {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nombre</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Rol</TableHead>
						<TableHead>Estado</TableHead>
						<TableHead className="text-right">Acciones</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell className="font-medium">
								{user.firstName} {user.lastName}
							</TableCell>
							<TableCell className="text-muted-foreground">{user.email}</TableCell>
							<TableCell>
								<Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
							</TableCell>
							<TableCell>
								<UserStatusBadge isActive={user.isActive} />
							</TableCell>
							<TableCell>
								<div className="flex justify-end gap-2">
									{onChangeRole && (
										<Button variant="ghost" size="sm" onClick={() => onChangeRole(user)}>
											Cambiar Rol
										</Button>
									)}
									{onEdit && (
										<Button variant="outline" size="sm" onClick={() => onEdit(user)}>
											Editar
										</Button>
									)}
									{onDeactivate && user.isActive && (
										<Button
											variant="destructive"
											size="sm"
											onClick={() => onDeactivate(user)}
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
	);
}
